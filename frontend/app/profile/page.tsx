"use client";

import {
  FormEvent,
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type ProfileForm = {
  fullName: string;
  email: string;
  emailVerified: boolean;
  age: string;
  gender: string;
  phone: string;
  location: string;
  height: string;
  weight: string;
  activityLevel: string;
  fitnessGoal: string;
  fitnessLevel: string;
  workoutDays: string;
  equipment: string;
  dietPreference: string;
  allergies: string;
  healthConditions: string;
  injuryDetails: string;
};

const defaultProfile: ProfileForm = {
  fullName: "",
  email: "",
  emailVerified: false,
  age: "",
  gender: "",
  phone: "",
  location: "",
  height: "",
  weight: "",
  activityLevel: "",
  fitnessGoal: "",
  fitnessLevel: "",
  workoutDays: "",
  equipment: "",
  dietPreference: "",
  allergies: "",
  healthConditions: "",
  injuryDetails: "",
};

const locationOptions = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
  "Other",
];

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileForm>(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("fitlife_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    fetchProfile();
  }, [router]);

  async function fetchProfile() {
    try {
      setPageLoading(true);
      setError("");

      const data = await apiRequest("/api/profile/me", {
        method: "GET",
      });

      const userProfile = data.profile;

      setProfile({
        fullName: userProfile.full_name || "",
        email: userProfile.email || "",
        emailVerified: userProfile.email_verified || false,
        age: userProfile.age ? String(userProfile.age) : "",
        gender: userProfile.gender || "",
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        height: userProfile.height_cm ? String(userProfile.height_cm) : "",
        weight: userProfile.weight_kg ? String(userProfile.weight_kg) : "",
        activityLevel: userProfile.activity_level || "",
        fitnessGoal: userProfile.fitness_goal || "",
        fitnessLevel: userProfile.fitness_level || "",
        workoutDays: userProfile.workout_days || "",
        equipment: userProfile.equipment || "",
        dietPreference: userProfile.diet_preference || "",
        allergies: userProfile.allergies || "",
        healthConditions: userProfile.health_conditions || "",
        injuryDetails: userProfile.injury_details || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setPageLoading(false);
    }
  }

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const calculateBMI = () => {
    const height = Number(profile.height);
    const weight = Number(profile.weight);

    if (!height || !weight) return "Not set";

    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    return bmi.toFixed(1);
  };

  const getBMICategory = () => {
    const bmi = Number(calculateBMI());

    if (!bmi) return "Not available";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      setSaving(true);

      const data = await apiRequest("/api/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          full_name: profile.fullName,
          age: profile.age ? Number(profile.age) : null,
          gender: profile.gender,
          phone: profile.phone,
          location: profile.location,
          height_cm: profile.height ? Number(profile.height) : null,
          weight_kg: profile.weight ? Number(profile.weight) : null,
          activity_level: profile.activityLevel,
          health_conditions: profile.healthConditions,
          injury_details: profile.injuryDetails,
          fitness_goal: profile.fitnessGoal,
          fitness_level: profile.fitnessLevel,
          workout_days: profile.workoutDays,
          equipment: profile.equipment,
          diet_preference: profile.dietPreference,
          allergies: profile.allergies,
        }),
      });

      const updatedProfile = data.profile;

      setProfile({
        fullName: updatedProfile.full_name || "",
        email: updatedProfile.email || "",
        emailVerified: updatedProfile.email_verified || false,
        age: updatedProfile.age ? String(updatedProfile.age) : "",
        gender: updatedProfile.gender || "",
        phone: updatedProfile.phone || "",
        location: updatedProfile.location || "",
        height: updatedProfile.height_cm ? String(updatedProfile.height_cm) : "",
        weight: updatedProfile.weight_kg ? String(updatedProfile.weight_kg) : "",
        activityLevel: updatedProfile.activity_level || "",
        fitnessGoal: updatedProfile.fitness_goal || "",
        fitnessLevel: updatedProfile.fitness_level || "",
        workoutDays: updatedProfile.workout_days || "",
        equipment: updatedProfile.equipment || "",
        dietPreference: updatedProfile.diet_preference || "",
        allergies: updatedProfile.allergies || "",
        healthConditions: updatedProfile.health_conditions || "",
        injuryDetails: updatedProfile.injury_details || "",
      });

      setMessage("Profile updated successfully.");
      setIsEditing(false);

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[32px] border border-orange-500/30 bg-[#111111] p-8 text-center shadow-2xl">
            <h1 className="text-3xl font-extrabold text-white">
              Loading Profile...
            </h1>
            <p className="mt-3 text-slate-400">
              Please wait while we fetch your profile details.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="profilePage min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[34px] border border-orange-500/30 bg-[#111111]/90 shadow-2xl backdrop-blur">
          <div className="h-44 bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500" />

          <div className="-mt-16 flex flex-col gap-6 px-8 pb-8 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-end">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-black bg-orange-500 text-5xl font-extrabold text-black shadow-xl">
                {(profile.fullName || "F").charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-extrabold text-white">
                    {profile.fullName || "FitLife User"}
                  </h1>

                  <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">
                    {profile.emailVerified
                      ? "Email Verified"
                      : "Email Not Verified"}
                  </span>
                </div>

                <p className="mt-2 text-slate-300">{profile.email}</p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-300">
                  <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2">
                    {profile.fitnessGoal || "Goal not set"}
                  </span>

                  <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2">
                    {profile.activityLevel || "Activity not set"}
                  </span>

                  <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2">
                    BMI {calculateBMI()}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="rounded-full bg-orange-500 px-6 py-3 font-extrabold text-black transition hover:bg-orange-400"
            >
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </button>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <SummaryCard
            title="BMI Score"
            value={calculateBMI()}
            note={getBMICategory()}
          />

          <SummaryCard
            title="Fitness Goal"
            value={profile.fitnessGoal || "Not set"}
            note="Personal target"
          />

          <SummaryCard
            title="Fitness Level"
            value={profile.fitnessLevel || "Not set"}
            note="Workout intensity"
          />

          <SummaryCard
            title="Workout Days"
            value={profile.workoutDays || "Not set"}
            note="Per week"
          />
        </section>

        {message && (
          <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 font-bold text-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 font-bold text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <section className="space-y-8">
            <ProfileCard
              title="Personal Information"
              description="Basic account and personal details."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />

                <Input
                  label="Email Address"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  disabled
                />

                <Input
                  label="Age"
                  name="age"
                  value={profile.age}
                  onChange={handleChange}
                  disabled={!isEditing}
                />

                <Select
                  label="Gender"
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                  disabled={!isEditing}
                  options={["Male", "Female", "Other"]}
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                />

                <Select
                  label="Location"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  disabled={!isEditing}
                  options={locationOptions}
                />
              </div>
            </ProfileCard>

            <ProfileCard
              title="Body & Health Details"
              description="Health details used for BMI, risk prediction and recommendations."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Height cm"
                  name="height"
                  value={profile.height}
                  onChange={handleChange}
                  disabled={!isEditing}
                />

                <Input
                  label="Weight kg"
                  name="weight"
                  value={profile.weight}
                  onChange={handleChange}
                  disabled={!isEditing}
                />

                <Select
                  label="Activity Level"
                  name="activityLevel"
                  value={profile.activityLevel}
                  onChange={handleChange}
                  disabled={!isEditing}
                  options={[
                    "Sedentary",
                    "Light",
                    "Moderate",
                    "Active",
                    "Very Active",
                  ]}
                />

                <Input
                  label="Health Conditions"
                  name="healthConditions"
                  value={profile.healthConditions}
                  onChange={handleChange}
                  disabled={!isEditing}
                />

                <TextArea
                  label="Injury Details"
                  name="injuryDetails"
                  value={profile.injuryDetails}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </ProfileCard>

            <ProfileCard
              title="Fitness Preferences"
              description="Used by the AI Fitness Guider to create personalized plans."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Select
                  label="Fitness Goal"
                  name="fitnessGoal"
                  value={profile.fitnessGoal}
                  onChange={handleChange}
                  disabled={!isEditing}
                  options={[
                    "Weight Loss",
                    "Muscle Gain",
                    "Maintain Fitness",
                    "Improve Endurance",
                    "General Health",
                  ]}
                />

                <Select
                  label="Fitness Level"
                  name="fitnessLevel"
                  value={profile.fitnessLevel}
                  onChange={handleChange}
                  disabled={!isEditing}
                  options={["Beginner", "Intermediate", "Advanced"]}
                />

                <Select
                  label="Workout Days Per Week"
                  name="workoutDays"
                  value={profile.workoutDays}
                  onChange={handleChange}
                  disabled={!isEditing}
                  options={["2", "3", "4", "5", "6"]}
                />

                <Select
                  label="Available Equipment"
                  name="equipment"
                  value={profile.equipment}
                  onChange={handleChange}
                  disabled={!isEditing}
                  options={[
                    "No Equipment",
                    "Dumbbells",
                    "Resistance Bands",
                    "Gym",
                    "Home Equipment",
                  ]}
                />
              </div>
            </ProfileCard>

            <ProfileCard
              title="Diet Preferences"
              description="Used for personalized diet and nutrition recommendations."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Select
                  label="Diet Preference"
                  name="dietPreference"
                  value={profile.dietPreference}
                  onChange={handleChange}
                  disabled={!isEditing}
                  options={[
                    "Vegetarian",
                    "Non-Vegetarian",
                    "Vegan",
                    "Balanced Diet",
                  ]}
                />

                <Input
                  label="Allergies"
                  name="allergies"
                  value={profile.allergies}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </ProfileCard>

            {isEditing && (
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-orange-500 px-6 py-4 font-extrabold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving Profile..." : "Save Profile Changes"}
              </button>
            )}
          </section>

          <aside className="space-y-8">
            <ProfileCard
              title="Account Security"
              description="Manage account verification and access."
            >
              <div className="space-y-4">
                <SecurityItem
                  label="Email Verification"
                  value={profile.emailVerified ? "Verified" : "Not Verified"}
                  status={profile.emailVerified ? "success" : "normal"}
                />

                <SecurityItem label="Account Type" value="User" status="normal" />
                <SecurityItem label="Password" value="Protected" status="normal" />
              </div>
            </ProfileCard>

            <ProfileCard
              title="Profile Completeness"
              description="Complete your profile for better recommendations."
            >
              <div className="space-y-4">
                <div className="h-3 overflow-hidden rounded-full bg-orange-500/10">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${getProfileCompleteness(profile)}%` }}
                  />
                </div>

                <p className="text-sm font-semibold text-slate-300">
                  Your profile is {getProfileCompleteness(profile)}% complete.
                  Add all health and fitness details to improve recommendation
                  accuracy.
                </p>
              </div>
            </ProfileCard>

            <ProfileCard
              title="How FitLife Uses This"
              description="Your profile improves personalization."
            >
              <ul className="space-y-3 text-sm font-semibold leading-7 text-slate-300">
                <li>✓ BMI and health risk analysis</li>
                <li>✓ Diet recommendation</li>
                <li>✓ AI fitness guider</li>
                <li>✓ Sleep and goal progress report</li>
              </ul>
            </ProfileCard>
          </aside>
        </form>
      </div>
    </main>
  );
}

function getProfileCompleteness(profile: ProfileForm) {
  const fields = [
    profile.fullName,
    profile.email,
    profile.age,
    profile.gender,
    profile.phone,
    profile.location,
    profile.height,
    profile.weight,
    profile.activityLevel,
    profile.fitnessGoal,
    profile.fitnessLevel,
    profile.workoutDays,
    profile.equipment,
    profile.dietPreference,
    profile.allergies,
    profile.healthConditions,
    profile.injuryDetails,
  ];

  const completed = fields.filter((field) => field && field.trim() !== "")
    .length;

  return Math.round((completed / fields.length) * 100);
}

function SummaryCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[28px] border border-orange-500/30 bg-[#111111]/90 p-6 shadow-xl backdrop-blur">
      <p className="text-sm font-bold text-orange-400">{title}</p>
      <h3 className="mt-3 text-2xl font-extrabold text-white">{value}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-400">{note}</p>
    </div>
  );
}

function ProfileCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-orange-500/30 bg-[#111111]/90 p-7 shadow-2xl backdrop-blur">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-white">{title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  disabled,
}: {
  label: string;
  name: string;
  value: string;
  disabled?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-orange-400">
        {label}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={label}
        className="w-full rounded-2xl border border-orange-500/30 bg-black px-4 py-4 font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  );
}

function Select({
  label,
  name,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-orange-400">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-2xl border border-orange-500/30 bg-black px-4 py-4 font-semibold text-white outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <option value="">Select {label}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  disabled,
}: {
  label: string;
  name: string;
  value: string;
  disabled?: boolean;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-bold text-orange-400">
        {label}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={label}
        rows={4}
        className="w-full resize-none rounded-2xl border border-orange-500/30 bg-black px-4 py-4 font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  );
}

function SecurityItem({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "success" | "normal";
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-orange-500/20 bg-black/60 px-4 py-4">
      <span className="text-sm font-bold text-slate-300">{label}</span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-extrabold ${
          status === "success"
            ? "bg-green-500/10 text-green-300"
            : "bg-orange-500/10 text-orange-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}