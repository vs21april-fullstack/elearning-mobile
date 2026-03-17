/**
 * Profile Component
 * Admin profile management with profile info and password change tabs
 */

import { useState, useMemo, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile, changePassword } from "./profile.api";
import { useAuth } from "../../app/authContext";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "./profile.validation";
import { toastSuccess, toastError } from "../../utils/toast";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import { FormField, PasswordField } from "../../components/FormField";
import EyeOpen from "../../assets/svg/EyeOpen";
import EyeClosed from "../../assets/svg/EyeClosed";
import UserIcon from "../../assets/svg/UserIcon";
import styles from "./Profile.module.css";
import headerStyles from "../../styles/PageHeader.module.css";

const normalizeParentDetails = (parents) => {
  if (!parents || typeof parents !== "object") return null;

  const normalizePerson = (person) => {
    if (!person || typeof person !== "object") return null;

    const name = typeof person.name === "string" ? person.name.trim() : "";
    const phone = typeof person.phone === "string" ? person.phone.trim() : "";

    if (!name && !phone) return null;

    return {
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
    };
  };

  const father = normalizePerson(parents.father);
  const mother = normalizePerson(parents.mother);

  if (!father && !mother) return null;

  return {
    ...(father ? { father } : {}),
    ...(mother ? { mother } : {}),
  };
};

const normalizeTeacherProfile = (teacherProfile) => {
  if (!teacherProfile || typeof teacherProfile !== "object") {
    return { qualifications: [], experiences: [] };
  }

  const qualifications = Array.isArray(teacherProfile.qualifications)
    ? teacherProfile.qualifications
        .map((qualification) => ({
          degree:
            typeof qualification?.degree === "string"
              ? qualification.degree.trim()
              : "",
          university:
            typeof qualification?.university === "string"
              ? qualification.university.trim()
              : "",
        }))
        .filter(
          (qualification) => qualification.degree || qualification.university,
        )
    : [];

  const experiences = Array.isArray(teacherProfile.experiences)
    ? teacherProfile.experiences
        .map((experience) => ({
          title:
            typeof experience?.title === "string"
              ? experience.title.trim()
              : "",
          company:
            typeof experience?.company === "string"
              ? experience.company.trim()
              : "",
          startYear: experience?.startYear
            ? Number(experience.startYear)
            : undefined,
          endYear: experience?.endYear ? Number(experience.endYear) : undefined,
        }))
        .filter(
          (experience) =>
            experience.title ||
            experience.company ||
            experience.startYear ||
            experience.endYear,
        )
    : [];

  return { qualifications, experiences };
};

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const queryClient = useQueryClient();
  const profileQueryKey = ["profile", user?.id || user?.token || "anonymous"];

  // Fetch profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: profileQueryKey,
    queryFn: fetchProfile,
    enabled: !!user?.token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isStudent = profile?.role === "student";
  const isTeacher = profile?.role === "teacher";
  const studentCourses = profile?.studentCourses || [];
  const teacherCourses = profile?.teacherCourses || [];

  // Profile form
  const profileForm = useForm({
    resolver: yupResolver(updateProfileSchema),
    values: profile
      ? {
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          parents: {
            father: {
              name: profile.parents?.father?.name || "",
              phone: profile.parents?.father?.phone || "",
            },
            mother: {
              name: profile.parents?.mother?.name || "",
              phone: profile.parents?.mother?.phone || "",
            },
          },
          teacherProfile: {
            qualifications: profile.teacherProfile?.qualifications || [],
            experiences: profile.teacherProfile?.experiences || [],
          },
        }
      : {},
  });

  const {
    fields: qualificationFields,
    append: appendQualification,
    remove: removeQualification,
  } = useFieldArray({
    control: profileForm.control,
    name: "teacherProfile.qualifications",
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control: profileForm.control,
    name: "teacherProfile.experiences",
  });

  // Password form
  const passwordForm = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(profileQueryKey, data);
      toastSuccess("Profile updated successfully!");
    },
    onError: (error) => {
      toastError(error.response?.data?.message || "Failed to update profile");
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toastSuccess("Password changed successfully!");
      passwordForm.reset();
    },
    onError: (error) => {
      toastError(error.response?.data?.message || "Failed to change password");
    },
  });

  const handleProfileSubmit = useCallback(
    (data) => {
      const payload = { ...data };

      if (isStudent) {
        payload.parents = normalizeParentDetails(data.parents);
      } else {
        delete payload.parents;
      }

      if (isTeacher) {
        payload.teacherProfile = normalizeTeacherProfile(data.teacherProfile);
      } else {
        delete payload.teacherProfile;
      }

      updateProfileMutation.mutate(payload);
    },
    [isStudent, isTeacher, updateProfileMutation],
  );

  const handlePasswordSubmit = useCallback(
    (data) => {
      changePasswordMutation.mutate(data);
    },
    [changePasswordMutation],
  );

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const tabs = useMemo(
    () => [
      { id: "profile", label: "Profile Information" },
      { id: "password", label: "Change Password" },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div
        className={`d-flex justify-content-center align-items-center ${styles.loadingContainer}`}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <div className={`container-fluid px-4 py-4 ${styles.container}`}>
      {/* Header */}
      <div className={`animate-fade-in ${headerStyles.pageHeader}`}>
        <h2
          className={`fw-bold mb-2 ${headerStyles.pageTitle} ${headerStyles.titleWithIcon}`}
        >
          <UserIcon size={32} color="white" /> My Profile
        </h2>
        <p className={headerStyles.pageSubtitle}>
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className={`glass-card mb-4 p-2 ${styles.tabsContainer}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : styles.tabButtonInactive}`}
            onClick={() => handleTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Information Tab */}
      {activeTab === "profile" && (
        <div className={`glass-card animate-slide-in ${styles.profileCard}`}>
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
            <div className="row">
              {/* Form Fields */}
              <div className="col-md-12">
                <div className="row">
                  {/* Name */}
                  <div className="col-md-12">
                    <FormField
                      label="Full Name"
                      name="name"
                      control={profileForm.control}
                      errors={profileForm.formState.errors}
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email */}
                  <div className="col-md-12">
                    <FormField
                      label="Email Address"
                      name="email"
                      control={profileForm.control}
                      errors={profileForm.formState.errors}
                      type="email"
                      placeholder="Enter your email"
                      readOnly
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-md-12">
                    <FormField
                      label="Phone Number"
                      name="phone"
                      control={profileForm.control}
                      errors={profileForm.formState.errors}
                      type="tel"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {isStudent && (
                    <>
                      <div className="col-md-12 mt-3">
                        <h6 className="fw-bold mb-3">
                          Parent Details (Optional)
                        </h6>
                      </div>

                      <div className="col-md-6">
                        <FormField
                          label="Father Name"
                          name="parents.father.name"
                          control={profileForm.control}
                          errors={profileForm.formState.errors}
                          placeholder="Enter father name"
                        />
                      </div>

                      <div className="col-md-6">
                        <FormField
                          label="Father Phone"
                          name="parents.father.phone"
                          control={profileForm.control}
                          errors={profileForm.formState.errors}
                          type="tel"
                          placeholder="Enter father phone"
                        />
                      </div>

                      <div className="col-md-6">
                        <FormField
                          label="Mother Name"
                          name="parents.mother.name"
                          control={profileForm.control}
                          errors={profileForm.formState.errors}
                          placeholder="Enter mother name"
                        />
                      </div>

                      <div className="col-md-6">
                        <FormField
                          label="Mother Phone"
                          name="parents.mother.phone"
                          control={profileForm.control}
                          errors={profileForm.formState.errors}
                          type="tel"
                          placeholder="Enter mother phone"
                        />
                      </div>

                      <div className="col-md-12 mb-2">
                        <h6 className="fw-bold mb-3">My Courses</h6>
                        {studentCourses.length === 0 ? (
                          <p className="text-muted mb-0">
                            No courses enrolled yet.
                          </p>
                        ) : (
                          <ul className="list-group">
                            {studentCourses.map((enrollment) => {
                              const course =
                                typeof enrollment.course === "object"
                                  ? enrollment.course
                                  : null;

                              if (!course) return null;

                              return (
                                <li
                                  key={enrollment._id || course._id}
                                  className="list-group-item d-flex justify-content-between align-items-center"
                                >
                                  <span>{course.title}</span>
                                  <span className="badge bg-secondary text-capitalize">
                                    {enrollment.status || "enrolled"}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </>
                  )}

                  {isTeacher && (
                    <>
                      <div className="col-md-12 mt-3">
                        <h6 className="fw-bold mb-3">Qualifications</h6>
                      </div>

                      {qualificationFields.map((field, index) => (
                        <div className="col-md-12" key={field.id}>
                          <div className="row align-items-end">
                            <div className="col-md-5">
                              <FormField
                                label="Degree"
                                name={`teacherProfile.qualifications.${index}.degree`}
                                control={profileForm.control}
                                errors={profileForm.formState.errors}
                                placeholder="Enter degree"
                              />
                            </div>
                            <div className="col-md-5">
                              <FormField
                                label="University"
                                name={`teacherProfile.qualifications.${index}.university`}
                                control={profileForm.control}
                                errors={profileForm.formState.errors}
                                placeholder="Enter university"
                              />
                            </div>
                            <div className="col-md-2 mb-3">
                              <Button
                                variant="danger"
                                type="button"
                                onClick={() => removeQualification(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="col-md-12 mb-3">
                        <Button
                          variant="primary"
                          type="button"
                          onClick={() =>
                            appendQualification({ degree: "", university: "" })
                          }
                        >
                          + Add Qualification
                        </Button>
                      </div>

                      <div className="col-md-12 mt-2">
                        <h6 className="fw-bold mb-3">Experience</h6>
                      </div>

                      {experienceFields.map((field, index) => (
                        <div className="col-md-12" key={field.id}>
                          <div className="row align-items-end">
                            <div className="col-md-3">
                              <FormField
                                label="Title"
                                name={`teacherProfile.experiences.${index}.title`}
                                control={profileForm.control}
                                errors={profileForm.formState.errors}
                                placeholder="Enter title"
                              />
                            </div>
                            <div className="col-md-3">
                              <FormField
                                label="Company"
                                name={`teacherProfile.experiences.${index}.company`}
                                control={profileForm.control}
                                errors={profileForm.formState.errors}
                                placeholder="Enter company"
                              />
                            </div>
                            <div className="col-md-2">
                              <FormField
                                label="Start Year"
                                name={`teacherProfile.experiences.${index}.startYear`}
                                control={profileForm.control}
                                errors={profileForm.formState.errors}
                                type="number"
                                placeholder="2018"
                              />
                            </div>
                            <div className="col-md-2">
                              <FormField
                                label="End Year"
                                name={`teacherProfile.experiences.${index}.endYear`}
                                control={profileForm.control}
                                errors={profileForm.formState.errors}
                                type="number"
                                placeholder="2022"
                              />
                            </div>
                            <div className="col-md-2 mb-3">
                              <Button
                                variant="danger"
                                type="button"
                                onClick={() => removeExperience(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="col-md-12 mb-3">
                        <Button
                          variant="primary"
                          type="button"
                          onClick={() =>
                            appendExperience({
                              title: "",
                              company: "",
                              startYear: "",
                              endYear: "",
                            })
                          }
                        >
                          + Add Experience
                        </Button>
                      </div>

                      <div className="col-md-12 mb-2">
                        <h6 className="fw-bold mb-3">Assigned Courses</h6>
                        {teacherCourses.length === 0 ? (
                          <p className="text-muted mb-0">
                            No courses assigned yet.
                          </p>
                        ) : (
                          <ul className="list-group">
                            {teacherCourses.map((course) => (
                              <li
                                key={course._id}
                                className="list-group-item d-flex justify-content-between align-items-center"
                              >
                                <span>{course.title}</span>
                                <span className="badge bg-secondary text-capitalize">
                                  {course.level || "course"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  )}

                  {/* Role (Read-only) */}
                  {/* <div className="col-md-12 mb-3">
                    <Input
                      label="Role"
                      type="text"
                      value={profile?.role?.toUpperCase() || ""}
                      disabled
                      className={styles.roleInput}
                    />
                  </div> */}

                  {/* Submit Button */}
                  <div className="col-md-12">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={updateProfileMutation.isPending}
                    >
                      Update Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === "password" && (
        <div className={`glass-card animate-slide-in ${styles.profileCard}`}>
          <div className="row">
            <div className="col-md-12">
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                {/* Current Password */}
                <PasswordField
                  label="Current Password"
                  name="currentPassword"
                  control={passwordForm.control}
                  errors={passwordForm.formState.errors}
                  placeholder="Enter your current password"
                  showPassword={showCurrentPassword}
                  onTogglePassword={() =>
                    setShowCurrentPassword(!showCurrentPassword)
                  }
                  PasswordIcon={
                    showCurrentPassword ? <EyeOpen /> : <EyeClosed />
                  }
                  required
                  autoComplete="current-password"
                />

                {/* New Password */}
                <PasswordField
                  label="New Password"
                  name="newPassword"
                  control={passwordForm.control}
                  errors={passwordForm.formState.errors}
                  placeholder="Enter your new password"
                  showPassword={showNewPassword}
                  onTogglePassword={() => setShowNewPassword(!showNewPassword)}
                  PasswordIcon={showNewPassword ? <EyeOpen /> : <EyeClosed />}
                  required
                  autoComplete="new-password"
                />

                {/* Confirm Password */}
                <PasswordField
                  label="Confirm New Password"
                  name="confirmPassword"
                  control={passwordForm.control}
                  errors={passwordForm.formState.errors}
                  placeholder="Confirm your new password"
                  showPassword={showConfirmPassword}
                  onTogglePassword={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  PasswordIcon={
                    showConfirmPassword ? <EyeOpen /> : <EyeClosed />
                  }
                  required
                  autoComplete="new-password"
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  loading={changePasswordMutation.isPending}
                >
                  Change Password
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
