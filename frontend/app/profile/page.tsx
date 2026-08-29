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
      setError("");
      setIsEditing(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      setTimeout(() => {
        setMessage("");
      }, 5000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Profile update failed.";

      setError(errorMessage);
      setMessage("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      setTimeout(() => {
        setError("");
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <main className="profilePage">
        <div className="profileContainer">
          <div className="profileLoadingCard">
            <h1>Loading Profile...</h1>
            <p>Please wait while we fetch your profile details.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="profilePage">
      {message && (
        <div className="profileToast profileToastSuccess">
          <strong>Success</strong>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="profileToast profileToastError">
          <strong>Error</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="profileContainer">
        <section className="profileHeroCard">
          <div className="profileHeroTop">
            <div className="profileAvatar">
              {(profile.fullName || "F").charAt(0).toUpperCase()}
            </div>

            <div className="profileHeroInfo">
              <div className="profileNameRow">
                <h1>{profile.fullName || "FitLife User"}</h1>

                <span
                  className={
                    profile.emailVerified
                      ? "profileVerifyBadge verified"
                      : "profileVerifyBadge"
                  }
                >
                  {profile.emailVerified ? "Email Verified" : "Email Not Verified"}
                </span>
              </div>

              <p className="profileEmail">{profile.email}</p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="profileEditButton"
            >
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </button>
          </div>

          <div className="profileHeroBottom">
            <span>{profile.fitnessGoal || "Goal not set"}</span>
            <span>{profile.activityLevel || "Activity not set"}</span>
            <span>BMI {calculateBMI()}</span>
          </div>
        </section>

        <section className="profileSummaryGrid">
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

        <form onSubmit={handleSave} className="profileContentGrid">
          <section className="profileMainSections">
            <ProfileCard
              title="Personal Information"
              description="Basic account and personal details."
            >
              <div className="profileInputGrid">
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
              <div className="profileInputGrid">
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
              <div className="profileInputGrid">
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
              <div className="profileInputGrid">
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
                className="profileSaveButton"
              >
                {saving ? "Saving Profile..." : "Save Profile Changes"}
              </button>
            )}
          </section>

          <aside className="profileSidePanel">
            <ProfileCard
              title="Account Security"
              description="Manage account verification and access."
            >
              <div className="profileSecurityList">
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
              <div className="profileCompletenessBox">
                <div className="profileProgressTrack">
                  <div
                    className="profileProgressFill"
                    style={{ width: `${getProfileCompleteness(profile)}%` }}
                  />
                </div>

                <p>
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
              <ul className="profileUsageList">
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
    <div className="profileSummaryCard">
      <p>{title}</p>
      <h3>{value}</h3>
      <span>{note}</span>
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
    <section className="profileCard">
      <div className="profileCardHeader">
        <h2>{title}</h2>
        <p>{description}</p>
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
    <div className="profileField">
      <label>{label}</label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={label}
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
    <div className="profileField">
      <label>{label}</label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
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
    <div className="profileField profileFieldFull">
      <label>{label}</label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={label}
        rows={4}
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
    <div className="profileSecurityItem">
      <span>{label}</span>

      <strong className={status === "success" ? "success" : ""}>{value}</strong>
    </div>
  );
}