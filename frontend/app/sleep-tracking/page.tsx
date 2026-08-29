"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SleepResult = {
  _id?: string;
  age: number;
  gender: string;
  sleep_hours: number;
  sleep_quality: string;
  bedtime: string;
  wake_time: string;
  interruptions: number;
  screen_time_before_bed: string;
  caffeine_after_evening: string;
  stress_level: string;
  sleep_latency_minutes: number;
  daytime_sleepiness: string;
  late_heavy_meal: string;
  exercise_today: string;
  bedroom_dark: string;
  bedroom_quiet: string;
  bedroom_cool: string;
  comfortable_bed: string;
  bedroom_environment_score: number;
  notes: string;
  sleep_status: string;
  sleep_score: number;
  recommendations: string[];
  disclaimer: string;
};

type SleepLog = {
  sleep_hours: number;
  sleep_quality: string;
  bedtime: string;
  wake_time: string;
  sleep_score: number;
  sleep_status: string;
  date: string;
};

type SleepQuality = "poor" | "average" | "good" | "excellent";
type MoodLevel = "tired" | "normal" | "fresh";
type StressLevel = "low" | "moderate" | "high";
type SleepinessLevel = "low" | "medium" | "high";

type DailySleepProgress = {
  date: string;
  day: string;
  sleep_hours: string;
  sleep_quality: SleepQuality;
  bedtime: string;
  wake_time: string;
  interruptions: string;
  stress_level: StressLevel;
  mood: MoodLevel;
  sleep_latency_minutes: string;
  daytime_sleepiness: SleepinessLevel;
  screen_time_before_bed: string;
  caffeine_after_evening: string;
  late_heavy_meal: string;
  bedroom_dark: string;
  bedroom_quiet: string;
  bedroom_cool: string;
  comfortable_bed: string;
};

type LatestSleepProgress = {
  _id: string;
  week_start_date: string;
  recommended_sleep_hours: number;
  previous_average_sleep_hours?: number;
  average_sleep_hours: number;
  sleep_debt_hours: number;
  consistency_score: number;
  bedtime_consistency_score: number;
  wake_time_consistency_score: number;
  routine_status: string;
  irregular_bedtime_days: number;
  good_sleep_days: number;
  poor_sleep_days: number;
  interrupted_days: number;
  improvement_status: string;
  target_gap_message: string;
  weekly_insight_explanation: string;
  next_week_goal: string;
  next_week_recommendation: string;
  weekly_feedback: string;
  created_at: string;
};

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDate() {
  return toDateInputValue(new Date());
}

function getDayNameFromDate(dateText: string) {
  if (!dateText) return "Monday";

  const date = new Date(`${dateText}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
}

function formatChartDate(dateText: string, fallbackDay: string) {
  if (!dateText) return fallbackDay.slice(0, 3);

  const date = new Date(`${dateText}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getWeekDates(startDateText: string) {
  const startDate = new Date(`${startDateText}T00:00:00`);

  return weekDays.map((_, index) => {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + index);

    const date = toDateInputValue(currentDate);

    return {
      date,
      day: getDayNameFromDate(date),
    };
  });
}

function createDefaultDailySleep(
  startDateText = getTodayDate()
): DailySleepProgress[] {
  return getWeekDates(startDateText).map((item) => ({
    date: item.date,
    day: item.day,
    sleep_hours: "",
    sleep_quality: "average",
    bedtime: "",
    wake_time: "",
    interruptions: "0",
    stress_level: "moderate",
    mood: "normal",
    sleep_latency_minutes: "0",
    daytime_sleepiness: "medium",
    screen_time_before_bed: "no",
    caffeine_after_evening: "no",
    late_heavy_meal: "no",
    bedroom_dark: "yes",
    bedroom_quiet: "yes",
    bedroom_cool: "yes",
    comfortable_bed: "yes",
  }));
}

export default function SleepTrackingPage() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    sleep_hours: "",
    sleep_quality: "good",
    bedtime: "",
    wake_time: "",
    interruptions: "0",
    screen_time_before_bed: "no",
    caffeine_after_evening: "no",
    stress_level: "medium",
    sleep_latency_minutes: "0",
    daytime_sleepiness: "medium",
    late_heavy_meal: "no",
    exercise_today: "no",
    bedroom_dark: "yes",
    bedroom_quiet: "yes",
    bedroom_cool: "yes",
    comfortable_bed: "yes",
    notes: "",
  });

  const [weeklyData, setWeeklyData] = useState({
    week_start_date: getTodayDate(),
    recommended_sleep_hours: "7",
    previous_average_sleep_hours: "",
    weekly_feedback: "",
    daily_sleep: createDefaultDailySleep(),
  });

  const [selectedSleepDate, setSelectedSleepDate] = useState(getTodayDate());

  const [profileSummary, setProfileSummary] = useState({
    activity_level: "-",
    fitness_goal: "-",
    health_conditions: "None",
  });

  const [result, setResult] = useState<SleepResult | null>(null);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [latestProgress, setLatestProgress] =
    useState<LatestSleepProgress | null>(null);

  const [loading, setLoading] = useState(false);
  const [weeklySaving, setWeeklySaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [profileMessage, setProfileMessage] = useState("");
  const [weeklyMessage, setWeeklyMessage] = useState("");
  const [error, setError] = useState("");
  const [weeklyError, setWeeklyError] = useState("");

  const weeklyPreview = useMemo(
    () =>
      calculateWeeklyPreview(
        weeklyData.daily_sleep,
        weeklyData.recommended_sleep_hours
      ),
    [weeklyData.daily_sleep, weeklyData.recommended_sleep_hours]
  );

  const weeklyChartData = useMemo(
    () =>
      weeklyData.daily_sleep.map((item) => ({
        day: formatChartDate(item.date, item.day),
        sleepHours: Number(item.sleep_hours) || 0,
      })),
    [weeklyData.daily_sleep]
  );

  const sleepComparisonData = useMemo(() => {
    if (!latestProgress) {
      return [];
    }

    return [
      {
        week: "Previous",
        average:
          latestProgress.previous_average_sleep_hours ||
          Number(weeklyData.previous_average_sleep_hours) ||
          0,
      },
      {
        week: "Current",
        average: latestProgress.average_sleep_hours || 0,
      },
    ];
  }, [latestProgress, weeklyData.previous_average_sleep_hours]);

  const selectedDayIndex = weeklyData.daily_sleep.findIndex(
    (item) => item.date === selectedSleepDate
  );

  const activeDayIndex = selectedDayIndex >= 0 ? selectedDayIndex : 0;

  const selectedDayData =
    weeklyData.daily_sleep[activeDayIndex] || createDefaultDailySleep()[0];

  const selectedDayName =
    selectedDayData?.day || getDayNameFromDate(selectedSleepDate);

  useEffect(() => {
    fetchProfileDetails();
    fetchLatestSleepProgress();
  }, []);

  async function fetchProfileDetails() {
    try {
      setProfileLoading(true);

      const data = await apiRequest("/api/profile/me", {
        method: "GET",
      });

      const profile = data.profile;

      setFormData((prev) => ({
        ...prev,
        age: profile.age ? String(profile.age) : prev.age,
        gender: normalizeGender(profile.gender) || prev.gender,
        notes: buildProfileNote(
          profile.activity_level,
          profile.fitness_goal,
          profile.health_conditions
        ),
      }));

      setProfileSummary({
        activity_level: profile.activity_level || "-",
        fitness_goal: profile.fitness_goal || "-",
        health_conditions: profile.health_conditions || "None",
      });

      setProfileMessage("Profile details loaded automatically.");
    } catch {
      setProfileMessage(
        "Profile details not found. You can enter sleep details manually."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function fetchLatestSleepProgress() {
    try {
      const data = await apiRequest("/api/sleep-progress/latest", {
        method: "GET",
      });

      if (data.has_progress && data.progress) {
        const progress = data.progress as LatestSleepProgress;

        setLatestProgress(progress);

        setWeeklyData((prev) => ({
          ...prev,
          previous_average_sleep_hours: progress.average_sleep_hours
            ? String(progress.average_sleep_hours)
            : prev.previous_average_sleep_hours,
        }));
      }
    } catch {
      setLatestProgress(null);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "bedtime" || name === "wake_time") {
        updated.sleep_hours = calculateSleepHoursFromTimes(
          updated.bedtime,
          updated.wake_time
        );
      }

      return updated;
    });
  };

  const handleWeeklyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "week_start_date") {
      setSelectedSleepDate(value);

      setWeeklyData((prev) => ({
        ...prev,
        week_start_date: value,
        daily_sleep: createDefaultDailySleep(value),
      }));

      return;
    }

    setWeeklyData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectedDateChange = (selectedDate: string) => {
    setSelectedSleepDate(selectedDate);

    const existingIndex = weeklyData.daily_sleep.findIndex(
      (item) => item.date === selectedDate
    );

    if (existingIndex === -1) {
      setWeeklyData((prev) => ({
        ...prev,
        daily_sleep: [
          ...prev.daily_sleep,
          {
            date: selectedDate,
            day: getDayNameFromDate(selectedDate),
            sleep_hours: "",
            sleep_quality: "average",
            bedtime: "",
            wake_time: "",
            interruptions: "0",
            stress_level: "moderate",
            mood: "normal",
            sleep_latency_minutes: "0",
            daytime_sleepiness: "medium",
            screen_time_before_bed: "no",
            caffeine_after_evening: "no",
            late_heavy_meal: "no",
            bedroom_dark: "yes",
            bedroom_quiet: "yes",
            bedroom_cool: "yes",
            comfortable_bed: "yes",
          },
        ],
      }));
    }
  };

  const handleDailySleepChange = (
    index: number,
    field: keyof DailySleepProgress,
    value: string
  ) => {
    setWeeklyData((prev) => {
      const updatedDays = [...prev.daily_sleep];
      const currentDay = updatedDays[index];

      const updatedDay = {
        ...currentDay,
        date: field === "date" ? value : currentDay.date,
        day:
          field === "date"
            ? getDayNameFromDate(value)
            : field === "day"
              ? value
              : currentDay.day,
        sleep_hours:
          field === "sleep_hours" ? value : currentDay.sleep_hours,
        sleep_quality:
          field === "sleep_quality"
            ? (value as SleepQuality)
            : currentDay.sleep_quality,
        bedtime: field === "bedtime" ? value : currentDay.bedtime,
        wake_time: field === "wake_time" ? value : currentDay.wake_time,
        interruptions:
          field === "interruptions" ? value : currentDay.interruptions,
        stress_level:
          field === "stress_level"
            ? (value as StressLevel)
            : currentDay.stress_level,
        mood: field === "mood" ? (value as MoodLevel) : currentDay.mood,
        sleep_latency_minutes:
          field === "sleep_latency_minutes"
            ? value
            : currentDay.sleep_latency_minutes,
        daytime_sleepiness:
          field === "daytime_sleepiness"
            ? (value as SleepinessLevel)
            : currentDay.daytime_sleepiness,
        screen_time_before_bed:
          field === "screen_time_before_bed"
            ? value
            : currentDay.screen_time_before_bed,
        caffeine_after_evening:
          field === "caffeine_after_evening"
            ? value
            : currentDay.caffeine_after_evening,
        late_heavy_meal:
          field === "late_heavy_meal" ? value : currentDay.late_heavy_meal,
        bedroom_dark:
          field === "bedroom_dark" ? value : currentDay.bedroom_dark,
        bedroom_quiet:
          field === "bedroom_quiet" ? value : currentDay.bedroom_quiet,
        bedroom_cool:
          field === "bedroom_cool" ? value : currentDay.bedroom_cool,
        comfortable_bed:
          field === "comfortable_bed" ? value : currentDay.comfortable_bed,
      };

      if (field === "bedtime" || field === "wake_time") {
        updatedDay.sleep_hours = calculateSleepHoursFromTimes(
          updatedDay.bedtime,
          updatedDay.wake_time
        );
      }

      updatedDays[index] = updatedDay;

      return {
        ...prev,
        daily_sleep: updatedDays,
      };
    });
  };

  const analyzeSleep = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setResult(null);
    setWeeklyMessage("");

    if (!formData.sleep_hours || !formData.bedtime || !formData.wake_time) {
      setError(
        "Please select bedtime and wake time. Sleep hours will calculate automatically."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/api/sleep/analyze", {
        method: "POST",
        body: JSON.stringify({
          age: Number(formData.age) || 25,
          gender: formData.gender,
          sleep_hours: Number(formData.sleep_hours),
          sleep_quality: formData.sleep_quality,
          bedtime: formatTimeForDisplay(formData.bedtime),
          wake_time: formatTimeForDisplay(formData.wake_time),
          interruptions: Number(formData.interruptions),
          screen_time_before_bed: formData.screen_time_before_bed,
          caffeine_after_evening: formData.caffeine_after_evening,
          stress_level: formData.stress_level,
          sleep_latency_minutes: Number(formData.sleep_latency_minutes) || 0,
          daytime_sleepiness: formData.daytime_sleepiness,
          late_heavy_meal: formData.late_heavy_meal,
          exercise_today: formData.exercise_today,
          bedroom_dark: formData.bedroom_dark,
          bedroom_quiet: formData.bedroom_quiet,
          bedroom_cool: formData.bedroom_cool,
          comfortable_bed: formData.comfortable_bed,
          notes: formData.notes,
        }),
      });

      setResult(data);

      const newLog: SleepLog = {
        sleep_hours: data.sleep_hours,
        sleep_quality: data.sleep_quality,
        bedtime: data.bedtime,
        wake_time: data.wake_time,
        sleep_score: data.sleep_score,
        sleep_status: data.sleep_status,
        date: "Today",
      };

      setSleepLogs((prev) => [newLog, ...prev]);

      setWeeklyData((prev) => {
        const updatedDays = [...prev.daily_sleep];

        let targetIndex = updatedDays.findIndex(
          (item) => item.date === selectedSleepDate
        );

        if (targetIndex === -1) {
          updatedDays.push({
            date: selectedSleepDate,
            day: getDayNameFromDate(selectedSleepDate),
            sleep_hours: "",
            sleep_quality: "average",
            bedtime: "",
            wake_time: "",
            interruptions: "0",
            stress_level: "moderate",
            mood: "normal",
            sleep_latency_minutes: "0",
            daytime_sleepiness: "medium",
            screen_time_before_bed: "no",
            caffeine_after_evening: "no",
            late_heavy_meal: "no",
            bedroom_dark: "yes",
            bedroom_quiet: "yes",
            bedroom_cool: "yes",
            comfortable_bed: "yes",
          });

          targetIndex = updatedDays.length - 1;
        }

        updatedDays[targetIndex] = {
          ...updatedDays[targetIndex],
          sleep_hours: formData.sleep_hours,
          sleep_quality: formData.sleep_quality as SleepQuality,
          bedtime: formData.bedtime,
          wake_time: formData.wake_time,
          interruptions: formData.interruptions,
          stress_level: mapStressToWeekly(formData.stress_level),
          mood: Number(formData.sleep_hours) >= 7 ? "fresh" : "normal",
          sleep_latency_minutes: formData.sleep_latency_minutes,
          daytime_sleepiness: formData.daytime_sleepiness as SleepinessLevel,
          screen_time_before_bed: formData.screen_time_before_bed,
          caffeine_after_evening: formData.caffeine_after_evening,
          late_heavy_meal: formData.late_heavy_meal,
          bedroom_dark: formData.bedroom_dark,
          bedroom_quiet: formData.bedroom_quiet,
          bedroom_cool: formData.bedroom_cool,
          comfortable_bed: formData.comfortable_bed,
        };

        return {
          ...prev,
          daily_sleep: updatedDays,
        };
      });

      setWeeklyMessage(
        "Sleep analysis automatically added to weekly tracker. Review it below and save weekly progress."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sleep analysis failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const saveWeeklySleepProgress = async (e: FormEvent) => {
    e.preventDefault();

    setWeeklyError("");
    setWeeklyMessage("");

    const hasAtLeastOneDay = weeklyData.daily_sleep.some(
      (item) => Number(item.sleep_hours) > 0
    );

    if (!hasAtLeastOneDay) {
      setWeeklyError("Please enter at least one day of sleep data.");
      return;
    }

    try {
      setWeeklySaving(true);

      const dailySleepPayload = weeklyData.daily_sleep.map((item) => ({
        date: item.date,
        day: item.day,
        sleep_hours: item.sleep_hours ? Number(item.sleep_hours) : 0,
        sleep_quality: item.sleep_quality,
        bedtime: formatTimeForDisplay(item.bedtime),
        wake_time: formatTimeForDisplay(item.wake_time),
        interruptions: item.interruptions ? Number(item.interruptions) : 0,
        stress_level: item.stress_level,
        mood: item.mood,
        sleep_latency_minutes: item.sleep_latency_minutes
          ? Number(item.sleep_latency_minutes)
          : 0,
        daytime_sleepiness: item.daytime_sleepiness,
        screen_time_before_bed: item.screen_time_before_bed,
        caffeine_after_evening: item.caffeine_after_evening,
        late_heavy_meal: item.late_heavy_meal,
        bedroom_dark: item.bedroom_dark,
        bedroom_quiet: item.bedroom_quiet,
        bedroom_cool: item.bedroom_cool,
        comfortable_bed: item.comfortable_bed,
      }));

      const data = await apiRequest("/api/sleep-progress/save", {
        method: "POST",
        body: JSON.stringify({
          week_start_date: weeklyData.week_start_date || getTodayDate(),
          recommended_sleep_hours: Number(weeklyData.recommended_sleep_hours),
          previous_average_sleep_hours: weeklyData.previous_average_sleep_hours
            ? Number(weeklyData.previous_average_sleep_hours)
            : null,
          weekly_feedback: weeklyData.weekly_feedback,
          daily_sleep: dailySleepPayload,
        }),
      });

      setWeeklyMessage(
        `${data.message}. Average sleep: ${formatSleepDurationForUser(
          data.average_sleep_hours
        )}.`
      );

      await fetchLatestSleepProgress();
    } catch (err) {
      setWeeklyError(
        err instanceof Error
          ? err.message
          : "Failed to save weekly sleep progress."
      );
    } finally {
      setWeeklySaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="sleepPage sleepCompactPage sleepWeeklyPage">
        <section className="sleepCompactHero">
          <div className="container sleepHeroWrap">
            <div>
              <span className="badge">AI Sleep Tracking</span>

              <h1>Analyze Your Sleep Quality</h1>

              <p>
                FitLife uses your saved profile and sleep habits to calculate a
                sleep score, identify sleep quality, and provide weekly sleep
                improvement guidance.
              </p>
            </div>

            <div className="sleepHeroHighlights">
              <div>
                <strong>Daily Result</strong>
                <span>Sleep score</span>
              </div>

              <div>
                <strong>Weekly Graph</strong>
                <span>Sleep trend</span>
              </div>

              <div>
                <strong>Improvement</strong>
                <span>Next week goal</span>
              </div>
            </div>
          </div>
        </section>

        <section className="sleepCompactSection">
          <div className="container sleepDashboardLayout">
            <div className="sleepProfileCard sleepProfileFull">
              <div className="sleepCardTop">
                <div>
                  <span className="miniLabel">Profile Summary</span>
                  <h2>Auto-loaded Details</h2>
                </div>
              </div>

              <p className="sleepStatusText">
                {profileLoading ? "Loading profile details..." : profileMessage}
              </p>

              <div className="sleepProfileGrid">
                <div>
                  <span>Age</span>
                  <strong>{formData.age || "-"}</strong>
                </div>

                <div>
                  <span>Gender</span>
                  <strong>{formatText(formData.gender)}</strong>
                </div>

                <div>
                  <span>Activity Level</span>
                  <strong>{formatText(profileSummary.activity_level)}</strong>
                </div>

                <div>
                  <span>Fitness Goal</span>
                  <strong>{formatText(profileSummary.fitness_goal)}</strong>
                </div>

                <div>
                  <span>Health Conditions</span>
                  <strong>{formatText(profileSummary.health_conditions)}</strong>
                </div>

                <div>
                  <span>Sleep Input</span>
                  <strong>
                    {formatSleepDurationForUser(formData.sleep_hours) || "-"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="sleepWorkGrid">
              <form onSubmit={analyzeSleep} className="sleepQuickForm">
                <div className="sleepCardTop">
                  <div>
                    <span className="miniLabel">Step 1</span>
                    <h2>Daily Sleep Prediction</h2>
                  </div>
                </div>

                {error && <div className="errorMessage">{error}</div>}

                <div className="sleepQuickGrid">
                  <label>
                    Bedtime
                    <input
                      type="time"
                      name="bedtime"
                      value={formData.bedtime}
                      onChange={handleChange}
                    />
                  </label>

                  <label>
                    Wake Time
                    <input
                      type="time"
                      name="wake_time"
                      value={formData.wake_time}
                      onChange={handleChange}
                    />
                  </label>

                  <label>
                    Sleep Hours
                    <input
                      type="text"
                      name="sleep_hours_display"
                      placeholder="Auto calculated"
                      value={formatSleepDurationForUser(formData.sleep_hours)}
                      readOnly
                      className="sleepAutoCalculatedInput"
                    />
                  </label>

                  <label>
                    Time to Fall Asleep
                    <input
                      type="number"
                      name="sleep_latency_minutes"
                      min="0"
                      max="240"
                      placeholder="Example: 20"
                      value={formData.sleep_latency_minutes}
                      onChange={handleChange}
                    />
                  </label>

                  <label>
                    Sleep Quality
                    <select
                      name="sleep_quality"
                      value={formData.sleep_quality}
                      onChange={handleChange}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="average">Average</option>
                      <option value="poor">Poor</option>
                    </select>
                  </label>

                  <label>
                    Daytime Sleepiness
                    <select
                      name="daytime_sleepiness"
                      value={formData.daytime_sleepiness}
                      onChange={handleChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>

                  <label>
                    Interruptions
                    <input
                      type="number"
                      name="interruptions"
                      placeholder="Example: 1"
                      value={formData.interruptions}
                      onChange={handleChange}
                    />
                  </label>

                  <label>
                    Stress Level
                    <select
                      name="stress_level"
                      value={formData.stress_level}
                      onChange={handleChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                </div>

                <details className="sleepAdvancedSection">
                  <summary>Profile fallback details</summary>

                  <div className="sleepQuickGrid">
                    <label>
                      Age
                      <input
                        type="number"
                        name="age"
                        placeholder="Example: 25"
                        value={formData.age}
                        onChange={handleChange}
                      />
                    </label>

                    <label>
                      Gender
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </label>
                  </div>
                </details>

                <details className="sleepAdvancedSection" open>
                  <summary>Sleep habit details</summary>

                  <div className="sleepQuickGrid">
                    <label>
                      Screen Time Before Bed
                      <select
                        name="screen_time_before_bed"
                        value={formData.screen_time_before_bed}
                        onChange={handleChange}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>

                    <label>
                      Caffeine After Evening
                      <select
                        name="caffeine_after_evening"
                        value={formData.caffeine_after_evening}
                        onChange={handleChange}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>

                    <label>
                      Late Heavy Meal
                      <select
                        name="late_heavy_meal"
                        value={formData.late_heavy_meal}
                        onChange={handleChange}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>

                    <label>
                      Exercise Today
                      <select
                        name="exercise_today"
                        value={formData.exercise_today}
                        onChange={handleChange}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>
                  </div>

                  <label className="sleepFullText">
                    Notes
                    <textarea
                      name="notes"
                      placeholder="Example: I feel tired in the morning"
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </label>
                </details>

                <details className="sleepAdvancedSection" open>
                  <summary>Bedroom environment</summary>

                  <div className="sleepQuickGrid">
                    <label>
                      Dark Room
                      <select
                        name="bedroom_dark"
                        value={formData.bedroom_dark}
                        onChange={handleChange}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>

                    <label>
                      Quiet Room
                      <select
                        name="bedroom_quiet"
                        value={formData.bedroom_quiet}
                        onChange={handleChange}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>

                    <label>
                      Cool Room
                      <select
                        name="bedroom_cool"
                        value={formData.bedroom_cool}
                        onChange={handleChange}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>

                    <label>
                      Comfortable Bed
                      <select
                        name="comfortable_bed"
                        value={formData.comfortable_bed}
                        onChange={handleChange}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                  </div>
                </details>

                <button
                  type="submit"
                  className="sleepGenerateBtn"
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "Analyze Sleep"}
                </button>
              </form>

              <div className="sleepCompactRight">
                {!result ? (
                  <div className="sleepEmptyResult">
                    <div className="sleepCircleIcon">SL</div>

                    <h2>Sleep Result Preview</h2>

                    <p>
                      Your sleep score, sleep status, sleep habit summary, and
                      recommendations will appear here after analysis.
                    </p>

                    <div className="sleepEmptyList">
                      <span>Sleep score</span>
                      <span>Sleep status</span>
                      <span>Healthy sleep recommendations</span>
                    </div>
                  </div>
                ) : (
                  <div className="sleepResultContent">
                    <span className="sleepResultBadge">
                      {result.sleep_status}
                    </span>

                    <h2>Your Sleep Analysis</h2>

                    <p className="sleepMatchText">
                      {getSleepLevel(result.sleep_score)}
                    </p>

                    <div className="sleepScoreBox">
                      <span>Sleep Score</span>
                      <strong>{result.sleep_score}/100</strong>
                      <p>{result.sleep_status}</p>
                    </div>

                    <div className="sleepSummaryGrid">
                      <div>
                        <span>Sleep Hours</span>
                        <strong>
                          {formatSleepDurationForUser(result.sleep_hours)}
                        </strong>
                      </div>

                      <div>
                        <span>Quality</span>
                        <strong>{formatText(result.sleep_quality)}</strong>
                      </div>

                      <div>
                        <span>Latency</span>
                        <strong>{result.sleep_latency_minutes}m</strong>
                      </div>

                      <div>
                        <span>Sleepiness</span>
                        <strong>{formatText(result.daytime_sleepiness)}</strong>
                      </div>

                      <div>
                        <span>Bedtime</span>
                        <strong>{result.bedtime}</strong>
                      </div>

                      <div>
                        <span>Wake Time</span>
                        <strong>{result.wake_time}</strong>
                      </div>

                      <div>
                        <span>Environment</span>
                        <strong>{result.bedroom_environment_score}%</strong>
                      </div>

                      <div>
                        <span>Interruptions</span>
                        <strong>{result.interruptions}</strong>
                      </div>
                    </div>

                    <details className="sleepAdvancedSection sleepResultDetails" open>
                      <summary>Practical recommendations</summary>

                      <ul className="sleepRecommendationList">
                        {result.recommendations.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </details>

                    <p className="sleepFriendlyNote">
                      {result.disclaimer}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {result && (
              <div className="sleepWeeklyCard">
                <div className="sleepWeeklyHeader">
                  <div>
                    <span className="miniLabel">Step 2</span>
                    <h2>Weekly Sleep Progress</h2>
                    <p>
                      Your analyzed sleep data is added automatically. You can
                      review, edit, or select another date.
                    </p>
                  </div>

                  <div className="sleepWeeklyScore">
                    <span>Preview Average</span>
                    <strong>
                      {formatSleepDurationForUser(
                        weeklyPreview.average_sleep_hours
                      )}
                    </strong>
                    <p>{weeklyPreview.recorded_days} recorded days</p>
                  </div>
                </div>

                {weeklyMessage && (
                  <div className="sleepSuccessBox">{weeklyMessage}</div>
                )}

                {weeklyError && (
                  <div className="errorMessage">{weeklyError}</div>
                )}

                <form onSubmit={saveWeeklySleepProgress}>
                  <div className="sleepWeeklyMetaGrid">
                    <label>
                      Week Start Date
                      <input
                        type="date"
                        name="week_start_date"
                        value={weeklyData.week_start_date}
                        onChange={handleWeeklyChange}
                      />
                    </label>

                    <label>
                      Recommended Sleep Hours
                      <input
                        type="number"
                        step="0.1"
                        name="recommended_sleep_hours"
                        value={weeklyData.recommended_sleep_hours}
                        onChange={handleWeeklyChange}
                      />
                    </label>

                    <label>
                      Previous Week Average
                      <input
                        type="number"
                        step="0.1"
                        name="previous_average_sleep_hours"
                        placeholder="Auto-filled after first save"
                        value={weeklyData.previous_average_sleep_hours}
                        onChange={handleWeeklyChange}
                      />
                    </label>
                  </div>

                  <div className="sleepCurrentDayCard">
                    <div className="sleepCurrentDayHeader">
                      <div>
                        <span className="miniLabel">Daily Update</span>
                        <h3>Weekly Day Review & Edit</h3>
                        <p>
                          Your analyzed sleep data is added automatically. You
                          can review, edit, or select another date.
                        </p>
                      </div>

                      <label className="sleepDaySelectLabel">
                        Select Date
                        <input
                          type="date"
                          value={selectedSleepDate}
                          onChange={(e) =>
                            handleSelectedDateChange(e.target.value)
                          }
                        />
                        <small>{selectedDayName}</small>
                      </label>
                    </div>

                    <div className="sleepCurrentDayInputs">
                      <label>
                        Bedtime
                        <input
                          type="time"
                          value={selectedDayData.bedtime}
                          onChange={(e) =>
                            handleDailySleepChange(
                              activeDayIndex,
                              "bedtime",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Wake Time
                        <input
                          type="time"
                          value={selectedDayData.wake_time}
                          onChange={(e) =>
                            handleDailySleepChange(
                              activeDayIndex,
                              "wake_time",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Hours
                        <input
                          type="text"
                          placeholder="Auto calculated"
                          value={formatSleepDurationForUser(
                            selectedDayData.sleep_hours
                          )}
                          readOnly
                          className="sleepAutoCalculatedInput"
                        />
                      </label>

                      <label>
                        Sleep Latency
                        <input
                          type="number"
                          min="0"
                          max="240"
                          placeholder="Minutes"
                          value={selectedDayData.sleep_latency_minutes}
                          onChange={(e) =>
                            handleDailySleepChange(
                              activeDayIndex,
                              "sleep_latency_minutes",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Quality
                        <select
                          value={selectedDayData.sleep_quality}
                          onChange={(e) =>
                            handleDailySleepChange(
                              activeDayIndex,
                              "sleep_quality",
                              e.target.value
                            )
                          }
                        >
                          <option value="excellent">Excellent</option>
                          <option value="good">Good</option>
                          <option value="average">Average</option>
                          <option value="poor">Poor</option>
                        </select>
                      </label>

                      <label>
                        Daytime Sleepiness
                        <select
                          value={selectedDayData.daytime_sleepiness}
                          onChange={(e) =>
                            handleDailySleepChange(
                              activeDayIndex,
                              "daytime_sleepiness",
                              e.target.value
                            )
                          }
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </label>

                      <label>
                        Interruptions
                        <input
                          type="number"
                          placeholder="0"
                          value={selectedDayData.interruptions}
                          onChange={(e) =>
                            handleDailySleepChange(
                              activeDayIndex,
                              "interruptions",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Stress
                        <select
                          value={selectedDayData.stress_level}
                          onChange={(e) =>
                            handleDailySleepChange(
                              activeDayIndex,
                              "stress_level",
                              e.target.value
                            )
                          }
                        >
                          <option value="low">Low</option>
                          <option value="moderate">Moderate</option>
                          <option value="high">High</option>
                        </select>
                      </label>

                      <label>
                        Mood
                        <select
                          value={selectedDayData.mood}
                          onChange={(e) =>
                            handleDailySleepChange(
                              activeDayIndex,
                              "mood",
                              e.target.value
                            )
                          }
                        >
                          <option value="fresh">Fresh</option>
                          <option value="normal">Normal</option>
                          <option value="tired">Tired</option>
                        </select>
                      </label>

                      <label>
                        Screen Before Bed
                        <select
                          value={selectedDayData.screen_time_before_bed}
                          onChange={(e) =>
                            handleDailySleepChange(
                              activeDayIndex,
                              "screen_time_before_bed",
                              e.target.value
                            )
                          }
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </label>

                      <label>
                        Caffeine Evening
                        <select
                          value={selectedDayData.caffeine_after_evening}
                          onChange={(e) =>
                            handleDailySleepChange(
                              activeDayIndex,
                              "caffeine_after_evening",
                              e.target.value
                            )
                          }
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </label>

                      <label>
                        Late Heavy Meal
                        <select
                          value={selectedDayData.late_heavy_meal}
                          onChange={(e) =>
                            handleDailySleepChange(
                              activeDayIndex,
                              "late_heavy_meal",
                              e.target.value
                            )
                          }
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </label>
                    </div>

                    <details className="sleepAdvancedSection" open>
                      <summary>Bedroom environment for this day</summary>

                      <div className="sleepCurrentDayInputs">
                        <label>
                          Dark Room
                          <select
                            value={selectedDayData.bedroom_dark}
                            onChange={(e) =>
                              handleDailySleepChange(
                                activeDayIndex,
                                "bedroom_dark",
                                e.target.value
                              )
                            }
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </label>

                        <label>
                          Quiet Room
                          <select
                            value={selectedDayData.bedroom_quiet}
                            onChange={(e) =>
                              handleDailySleepChange(
                                activeDayIndex,
                                "bedroom_quiet",
                                e.target.value
                              )
                            }
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </label>

                        <label>
                          Cool Room
                          <select
                            value={selectedDayData.bedroom_cool}
                            onChange={(e) =>
                              handleDailySleepChange(
                                activeDayIndex,
                                "bedroom_cool",
                                e.target.value
                              )
                            }
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </label>

                        <label>
                          Comfortable Bed
                          <select
                            value={selectedDayData.comfortable_bed}
                            onChange={(e) =>
                              handleDailySleepChange(
                                activeDayIndex,
                                "comfortable_bed",
                                e.target.value
                              )
                            }
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </label>
                      </div>
                    </details>
                  </div>

                  <div className="sleepChartCard">
                    <div className="sleepChartTop">
                      <div>
                        <span className="miniLabel">Weekly Graph</span>
                        <h3>This Week Sleep Hours</h3>
                        <p>
                          Bars show daily sleep hours. The target line shows the
                          recommended sleep duration.
                        </p>
                      </div>

                      <div className="sleepChartTarget">
                        <span>Target</span>
                        <strong>
                          {formatSleepDurationForUser(
                            Number(weeklyData.recommended_sleep_hours) || 7
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="sleepChartBox">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={weeklyChartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.12)"
                          />

                          <XAxis
                            dataKey="day"
                            stroke="rgba(255,238,222,0.72)"
                          />

                          <YAxis
                            stroke="rgba(255,238,222,0.72)"
                            domain={[0, 10]}
                          />

                          <Tooltip
                            contentStyle={{
                              background: "rgba(8,8,8,0.94)",
                              border: "1px solid rgba(255,132,0,0.3)",
                              borderRadius: "14px",
                              color: "#ffffff",
                            }}
                            labelStyle={{
                              color: "#ffad5a",
                              fontWeight: 900,
                            }}
                            formatter={(value) =>
                              formatSleepDurationForUser(Number(value))
                            }
                            cursor={{ fill: "rgba(255,132,0,0.08)" }}
                          />

                          <ReferenceLine
                            y={Number(weeklyData.recommended_sleep_hours) || 7}
                            stroke="#ffad5a"
                            strokeDasharray="5 5"
                          />

                          <Bar
                            dataKey="sleepHours"
                            name="Sleep Hours"
                            fill="#ff8a00"
                            radius={[12, 12, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <label className="sleepFullText sleepWeeklyFeedback">
                    Weekly Feedback
                    <textarea
                      name="weekly_feedback"
                      placeholder="Example: I slept earlier this week but Sunday was disturbed."
                      value={weeklyData.weekly_feedback}
                      onChange={handleWeeklyChange}
                    />
                  </label>

                  <button
                    type="submit"
                    className="sleepGenerateBtn"
                    disabled={weeklySaving}
                  >
                    {weeklySaving
                      ? "Saving Weekly Progress..."
                      : "Save Weekly Sleep Progress"}
                  </button>
                </form>
              </div>
            )}

            {latestProgress && (
  <section className="sleepImprovementCard sleepInsightV2">
    <div className="sleepInsightHeader">
      <div>
        <span className="miniLabel">Step 3</span>
        <h2>Weekly Sleep Improvement Summary</h2>
        <p>
          {latestProgress.next_week_recommendation ||
            "Save weekly sleep progress to generate personalized sleep improvement guidance."}
        </p>
      </div>

      <div className="sleepInsightHeaderScore">
        <span>Average Sleep</span>
        <strong>
          {formatSleepDurationForUser(latestProgress.average_sleep_hours) || "0h"}
        </strong>
      </div>
    </div>

    <div className="sleepInsightBody">
      <div className="sleepInsightChartCard">
        <div className="sleepInsightChartTop">
          <div>
            <span className="miniLabel">Trend</span>
            <h3>Previous vs Current Week</h3>
          </div>
        </div>

        {sleepComparisonData.length > 0 ? (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={sleepComparisonData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.12)"
              />

              <XAxis
                dataKey="week"
                stroke="rgba(255,238,222,0.72)"
              />

              <YAxis
                stroke="rgba(255,238,222,0.72)"
                domain={[0, 10]}
              />

              <Tooltip
                contentStyle={{
                  background: "rgba(8,8,8,0.94)",
                  border: "1px solid rgba(255,132,0,0.3)",
                  borderRadius: "14px",
                  color: "#ffffff",
                }}
                labelStyle={{
                  color: "#ffad5a",
                  fontWeight: 900,
                }}
                formatter={(value) =>
                  formatSleepDurationForUser(Number(value))
                }
                cursor={{ fill: "rgba(255,132,0,0.08)" }}
              />

              <Bar
                dataKey="average"
                name="Average Sleep"
                fill="#ff8a00"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="sleepInsightEmpty">
            Not enough weekly data yet.
          </div>
        )}
      </div>

      <div className="sleepMetricGrid">
        <div className="sleepMetricCard">
          <span>Sleep Debt</span>
          <strong>
            {formatSleepDurationForUser(latestProgress.sleep_debt_hours) || "0h"}
          </strong>
        </div>

        <div className="sleepMetricCard">
          <span>Consistency</span>
          <strong>{latestProgress.consistency_score ?? 0}%</strong>
        </div>

        <div className="sleepMetricCard">
          <span>Routine Status</span>
          <strong>{latestProgress.routine_status || "Not enough data"}</strong>
        </div>

        <div className="sleepMetricCard">
          <span>Bedtime Consistency</span>
          <strong>{latestProgress.bedtime_consistency_score ?? 0}%</strong>
        </div>

        <div className="sleepMetricCard">
          <span>Wake Consistency</span>
          <strong>{latestProgress.wake_time_consistency_score ?? 0}%</strong>
        </div>

        <div className="sleepMetricCard">
          <span>Irregular Bedtime</span>
          <strong>{latestProgress.irregular_bedtime_days ?? 0}</strong>
        </div>

        <div className="sleepMetricCard">
          <span>Status</span>
          <strong>{latestProgress.improvement_status || "Baseline week"}</strong>
        </div>

        <div className="sleepMetricCard">
          <span>Good Days</span>
          <strong>{latestProgress.good_sleep_days ?? 0}</strong>
        </div>

        <div className="sleepMetricCard">
          <span>Poor Days</span>
          <strong>{latestProgress.poor_sleep_days ?? 0}</strong>
        </div>
      </div>
    </div>

    <div className="sleepInsightTextGrid">
      <div className="sleepInsightTextCard">
        <span>Target Gap</span>
        <strong>
          {latestProgress.target_gap_message ||
            "Save more records to calculate the target gap."}
        </strong>
      </div>

      <div className="sleepInsightTextCard">
        <span>Weekly Insight</span>
        <strong>
          {latestProgress.weekly_insight_explanation ||
            "Weekly insight will appear after saving sleep progress."}
        </strong>
      </div>

      <div className="sleepInsightTextCard">
        <span>Next Week Goal</span>
        <strong>
          {latestProgress.next_week_goal ||
            "Record sleep for more days next week."}
        </strong>
      </div>
    </div>
  </section>
)}

            <div className="sleepHistoryCardArea">
              <div className="sleepHistoryHeader">
                <div>
                  <span className="badge">History</span>
                  <h2>Recent Sleep Logs</h2>
                </div>
              </div>

              {sleepLogs.length === 0 ? (
                <div className="sleepNoHistory">
                  No sleep logs yet. Analyze your first sleep record to see it here.
                </div>
              ) : (
                <div className="sleepHistoryGrid">
                  {sleepLogs.map((log, index) => (
                    <div className="sleepHistoryCard" key={`${log.date}-${index}`}>
                      <div>
                        <h3>{log.date}</h3>
                        <p>{log.sleep_status}</p>
                      </div>

                      <div className="sleepHistoryStats">
                        <span>{formatSleepDurationForUser(log.sleep_hours)}</span>
                        <span>{formatText(log.sleep_quality)}</span>
                        <span>{log.sleep_score} score</span>
                      </div>

                      <p>
                        Bedtime: {log.bedtime} | Wake Time: {log.wake_time}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

function parseSleepTimeToMinutes(timeText: string): number | null {
  const cleanedTime = timeText.trim().toLowerCase().replace(/\s+/g, "");

  if (!cleanedTime) {
    return null;
  }

  const normalizedTime = cleanedTime.replace(".", ":");

  const hasAm = normalizedTime.endsWith("am");
  const hasPm = normalizedTime.endsWith("pm");

  const timeWithoutPeriod = normalizedTime.replace("am", "").replace("pm", "");

  const match = timeWithoutPeriod.match(/^(\d{1,2})(?::(\d{2}))?$/);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] || "0");

  if (Number.isNaN(hour) || Number.isNaN(minute) || minute > 59) {
    return null;
  }

  if (hasAm || hasPm) {
    if (hour < 1 || hour > 12) {
      return null;
    }

    if (hasPm && hour !== 12) {
      hour += 12;
    }

    if (hasAm && hour === 12) {
      hour = 0;
    }
  } else if (hour > 23) {
    return null;
  }

  return hour * 60 + minute;
}

function calculateSleepHoursFromTimes(
  bedtime: string,
  wakeTime: string
): string {
  const bedtimeMinutes = parseSleepTimeToMinutes(bedtime);
  const wakeTimeMinutes = parseSleepTimeToMinutes(wakeTime);

  if (bedtimeMinutes === null || wakeTimeMinutes === null) {
    return "";
  }

  let durationMinutes = wakeTimeMinutes - bedtimeMinutes;

  if (durationMinutes <= 0) {
    durationMinutes += 24 * 60;
  }

  if (durationMinutes <= 0 || durationMinutes > 16 * 60) {
    return "";
  }

  const durationHours = durationMinutes / 60;

  return String(Number(durationHours.toFixed(2)));
}

function formatSleepDurationForUser(hoursText: string | number) {
  const totalHours = Number(hoursText);

  if (!totalHours || Number.isNaN(totalHours)) {
    return "";
  }

  let hours = Math.floor(totalHours);
  let minutes = Math.round((totalHours - hours) * 60);

  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function formatTimeForDisplay(timeText: string) {
  const minutes = parseSleepTimeToMinutes(timeText);

  if (minutes === null) {
    return timeText;
  }

  const dayMinutes = minutes % (24 * 60);
  const hour24 = Math.floor(dayMinutes / 60);
  const minute = dayMinutes % 60;

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const displayMinute = String(minute).padStart(2, "0");

  return `${hour12}:${displayMinute} ${period}`;
}

function calculateWeeklyPreview(
  dailySleep: DailySleepProgress[],
  recommendedSleepHours: string
) {
  const recordedDays = dailySleep.filter(
    (item) => Number(item.sleep_hours) > 0
  );

  if (recordedDays.length === 0) {
    return {
      average_sleep_hours: "0",
      sleep_debt_hours: "0",
      recorded_days: 0,
    };
  }

  const totalSleep = recordedDays.reduce(
    (total, item) => total + Number(item.sleep_hours),
    0
  );

  const recommended = Number(recommendedSleepHours) || 7;
  const expected = recommended * recordedDays.length;
  const sleepDebt = Math.max(0, expected - totalSleep);

  return {
    average_sleep_hours: String(
      Number((totalSleep / recordedDays.length).toFixed(2))
    ),
    sleep_debt_hours: String(Number(sleepDebt.toFixed(2))),
    recorded_days: recordedDays.length,
  };
}

function getSleepLevel(score: number) {
  if (score >= 85) {
    return "Excellent sleep pattern. Continue maintaining your routine.";
  }

  if (score >= 70) {
    return "Good sleep quality. Small improvements can make it better.";
  }

  if (score >= 50) {
    return "Moderate sleep quality. Improve consistency, screen habits, and stress control.";
  }

  return "Poor sleep quality. Focus on sleep duration, routine, and reducing disruptions.";
}

function formatText(value: string) {
  if (!value) return "-";

  return value
    .split(" ")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function normalizeGender(gender?: string) {
  if (!gender) return "";

  const value = gender.toLowerCase();

  if (value === "male") return "male";
  if (value === "female") return "female";

  return "";
}

function mapStressToWeekly(stressLevel: string): StressLevel {
  const value = stressLevel.toLowerCase();

  if (value === "low") return "low";
  if (value === "high") return "high";

  return "moderate";
}

function buildProfileNote(
  activityLevel?: string,
  fitnessGoal?: string,
  healthConditions?: string
) {
  const parts = [];

  if (activityLevel) {
    parts.push(`Activity level: ${activityLevel}`);
  }

  if (fitnessGoal) {
    parts.push(`Fitness goal: ${fitnessGoal}`);
  }

  if (healthConditions) {
    parts.push(`Health conditions: ${healthConditions}`);
  }

  return parts.join(". ");
}