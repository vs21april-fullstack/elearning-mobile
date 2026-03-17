import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import {
  createTeacherSchema,
  updateTeacherSchema,
} from "../teachers.validation";
import { addTeacher, updateTeacher } from "../teachers.api";
import toast from "react-hot-toast";
import Button from "../../../components/Button";
import { FormField, PasswordField } from "../../../components/FormField";
import { useAuth } from "../../../app/authContext";
import EyeOpen from "../../../assets/svg/EyeOpen";
import EyeClosed from "../../../assets/svg/EyeClosed";
import styles from "./AddUpdateTeacher.module.css";
import modalStyles from "../../../components/Modal.module.css";

const buildAutoPassword = (fullName) => {
  const firstName = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0];

  if (!firstName) return "";
  return `${firstName.toLowerCase()}@123`;
};

export default function AddUpdateTeacher({
  onClose,
  onSuccess,
  teacher = null,
}) {
  const { user } = useAuth();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";
  const [showPassword, setShowPassword] = useState(false);

  // Set selected class and course when editing
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(teacher ? updateTeacherSchema : createTeacherSchema),
    defaultValues: teacher || {
      name: "",
      phone: "",
      email: "",
      password: "",
      teacherProfile: {
        qualifications: [{ degree: "", university: "" }],
        experiences: [
          {
            title: "",
            company: "",
            startYear: "",
            endYear: "",
            isCurrent: false,
          },
        ],
      },
    },
  });

  const {
    fields: qualificationFields,
    append: appendQualification,
    remove: removeQualification,
  } = useFieldArray({
    control,
    name: "teacherProfile.qualifications",
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control,
    name: "teacherProfile.experiences",
  });

  const name = watch("name");

  useEffect(() => {
    if (teacher) {
      // Populate basic fields
      setValue("name", teacher.name || "");
      setValue("email", teacher.email || "");
      setValue("phone", teacher.phone || "");
      setValue("password", "");

      // Populate teacher profile if exists
      if (teacher.teacherProfile) {
        if (teacher.teacherProfile.qualifications?.length > 0) {
          setValue(
            "teacherProfile.qualifications",
            teacher.teacherProfile.qualifications,
          );
        }
        if (teacher.teacherProfile.experiences?.length > 0) {
          setValue(
            "teacherProfile.experiences",
            teacher.teacherProfile.experiences,
          );
        }
      }
    }
  }, [teacher, setValue]);

  useEffect(() => {
    if (!teacher) {
      setValue("password", buildAutoPassword(name));
    }
  }, [name, teacher, setValue]);

  const addMutation = useMutation({
    mutationFn: addTeacher,
    onSuccess: () => {
      toast.success("Teacher created successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create teacher");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTeacher,
    onSuccess: () => {
      toast.success("Teacher updated successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update teacher");
    },
  });

  const onSubmit = async (data) => {
    try {
      let payload = { ...data };

      const qualifications =
        payload.teacherProfile?.qualifications?.filter((item) => {
          const degree = item?.degree?.trim();
          const university = item?.university?.trim();
          return Boolean(degree || university);
        }) || [];

      const experiences =
        payload.teacherProfile?.experiences?.filter((item) => {
          const title = item?.title?.trim();
          const company = item?.company?.trim();
          const hasStartYear =
            item?.startYear !== "" && item?.startYear !== undefined;
          const hasEndYear =
            item?.endYear !== "" && item?.endYear !== undefined;
          const hasYears = hasStartYear || hasEndYear;
          return Boolean(title || company || hasYears || item?.isCurrent);
        }) || [];

      if (qualifications.length || experiences.length) {
        payload.teacherProfile = {
          ...(qualifications.length ? { qualifications } : {}),
          ...(experiences.length ? { experiences } : {}),
        };
      } else {
        delete payload.teacherProfile;
      }

      const { parents, ...teacherData } = payload;

      if (teacher) {
        await updateMutation.mutateAsync({
          id: teacher._id,
          teacherData,
        });
      } else {
        await addMutation.mutateAsync(teacherData);
      }

      onSuccess();
      reset();
      onClose();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const isLoading = addMutation.isPending || updateMutation.isPending;

  return (
    <div className={`modal d-block ${modalStyles.modalOverlay}`}>
      <div className={`modal-dialog modal-lg ${modalStyles.modalDialog}`}>
        <div
          className={`modal-content glass-card animate-fade-in ${modalStyles.modalContent}`}
        >
          <div className={`modal-header border-0 ${modalStyles.modalHeader}`}>
            <h5 className={`modal-title fw-bold ${modalStyles.modalTitle}`}>
              {teacher ? "Update Teacher" : "Add New Teacher"}
            </h5>
            <button
              type="button"
              className={`${modalStyles.closeButton} btn-close btn-close-white`}
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={`modal-body ${modalStyles.modalBody}`}>
              <div className="row">
                {/* Name */}
                <div className="col-md-6">
                  <FormField
                    label="Name"
                    name="name"
                    control={control}
                    errors={errors}
                    placeholder="Enter teacher name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <FormField
                    label="Email"
                    name="email"
                    control={control}
                    errors={errors}
                    type="email"
                    placeholder="Enter email"
                    required
                    autoComplete={teacher ? "email" : "new-email"}
                  />
                </div>

                {/* Phone */}
                <div className="col-md-6">
                  <FormField
                    label="Phone"
                    name="phone"
                    control={control}
                    errors={errors}
                    type="tel"
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                {/* Password (new teacher required, edit teacher admin-only optional) */}
                {(!teacher || isAdmin) && (
                  <div className="col-md-6">
                    <PasswordField
                      label="Password"
                      name="password"
                      control={control}
                      errors={errors}
                      placeholder={
                        teacher
                          ? "Enter new password (optional)"
                          : "Auto-generated from first name"
                      }
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      PasswordIcon={showPassword ? <EyeOpen /> : <EyeClosed />}
                      required={!teacher}
                      autoComplete="new-password"
                    />
                  </div>
                )}

                {/* Qualifications */}
                <div className="col-12 mb-3">
                  <label className={styles.selectLabel}>Qualifications</label>
                  {qualificationFields.map((field, index) => (
                    <div key={field.id} className="card mb-3 p-3">
                      <div className="row">
                        <div className="col-md-6 mb-2">
                          <FormField
                            label="Degree"
                            name={`teacherProfile.qualifications.${index}.degree`}
                            control={control}
                            errors={errors}
                            placeholder="e.g., B.Ed, M.Ed, PhD"
                          />
                        </div>
                        <div className="col-md-6 mb-2">
                          <FormField
                            label="University/Institute"
                            name={`teacherProfile.qualifications.${index}.university`}
                            control={control}
                            errors={errors}
                            placeholder="University or Institute name"
                          />
                        </div>
                        <div className="col-md-12 mb-2 d-flex justify-content-end align-items-end">
                          {qualificationFields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              className={styles.removeInlineButton}
                              onClick={() => removeQualification(index)}
                            >
                              −
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() =>
                      appendQualification({
                        degree: "",
                        university: "",
                      })
                    }
                  >
                    + Add Qualification
                  </Button>
                  {errors.teacherProfile?.qualifications && (
                    <div className={styles.fieldError}>
                      {errors.teacherProfile.qualifications.message}
                    </div>
                  )}
                </div>

                {/* Experiences */}
                <div className="col-12 mb-3">
                  <label className={styles.selectLabel}>Experience</label>
                  {experienceFields.map((field, index) => {
                    const isCurrent = Boolean(
                      watch(`teacherProfile.experiences.${index}.isCurrent`),
                    );

                    return (
                      <div key={field.id} className="card mb-3 p-3">
                        <div className="row">
                          <div className="col-md-6 mb-2">
                            <FormField
                              label="Job Title"
                              name={`teacherProfile.experiences.${index}.title`}
                              control={control}
                              errors={errors}
                              placeholder="e.g., Senior Teacher, Principal"
                            />
                          </div>
                          <div className="col-md-6 mb-2">
                            <FormField
                              label="Company/Organization"
                              name={`teacherProfile.experiences.${index}.company`}
                              control={control}
                              errors={errors}
                              placeholder="Company or school name"
                            />
                          </div>
                          <div className="col-md-4 mb-2">
                            <FormField
                              label="Start Year"
                              name={`teacherProfile.experiences.${index}.startYear`}
                              control={control}
                              errors={errors}
                              type="number"
                              placeholder="2020"
                              min="1950"
                            />
                          </div>
                          <div className="col-md-4 mb-2">
                            <FormField
                              label="End Year"
                              name={`teacherProfile.experiences.${index}.endYear`}
                              control={control}
                              errors={errors}
                              type="number"
                              placeholder="2024 or leave empty if current"
                              min="1950"
                              disabled={isCurrent}
                            />
                          </div>
                          <div className="col-md-2 mb-2">
                            <label className={styles.selectLabel}>
                              Current
                            </label>
                            <Controller
                              name={`teacherProfile.experiences.${index}.isCurrent`}
                              control={control}
                              render={({ field: checkboxField }) => (
                                <div className="form-check">
                                  <input
                                    {...checkboxField}
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={Boolean(checkboxField.value)}
                                    onChange={(event) => {
                                      const checked = event.target.checked;
                                      checkboxField.onChange(checked);
                                      if (checked) {
                                        setValue(
                                          `teacherProfile.experiences.${index}.endYear`,
                                          "",
                                        );
                                      }
                                    }}
                                  />
                                  <label className="form-check-label">
                                    Yes
                                  </label>
                                </div>
                              )}
                            />
                          </div>
                          <div className="col-md-2 mb-2 d-flex align-items-end">
                            {experienceFields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                className={styles.removeInlineButton}
                                onClick={() => removeExperience(index)}
                              >
                                −
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() =>
                      appendExperience({
                        title: "",
                        company: "",
                        startYear: "",
                        endYear: "",
                        isCurrent: false,
                      })
                    }
                  >
                    + Add Experience
                  </Button>
                  {errors.teacherProfile?.experiences && (
                    <div className={styles.fieldError}>
                      {errors.teacherProfile.experiences.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`modal-footer border-0 ${modalStyles.modalFooter}`}>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isLoading}
                loading={isLoading}
              >
                {teacher ? "Update Teacher" : "Add Teacher"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
