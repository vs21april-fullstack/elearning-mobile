import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import Select from "react-select";
import { createMeetingSchema } from "../meetings.validation";
import {
  createMeeting,
  updateMeeting,
  generateMeetingLink,
} from "../meetings.api";
import { fetchCourses } from "../../students/students.api";
import { fetchTeachers } from "../../teachers/teachers.api";
import { useAuth } from "../../../app/authContext";
import toast from "react-hot-toast";
import Button from "../../../components/Button";
import { FormField, TextareaField } from "../../../components/FormField";
import modalStyles from "../../../components/Modal.module.css";
import styles from "./AddUpdateMeeting.module.css";

// Custom styles for react-select
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "12px",
    border: state.isFocused ? "2px solid #2f7d57" : "1px solid #dee2e6",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(47, 125, 87, 0.1)" : "none",
    padding: "6px 8px",
    background: "white",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#2f7d57",
    },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#2f7d57"
      : state.isFocused
        ? "#f0f2ff"
        : "white",
    color: state.isSelected ? "white" : "#333",
    padding: "12px 16px",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#2f7d57",
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
    overflow: "hidden",
    marginTop: "8px",
  }),
  menuList: (base) => ({
    ...base,
    padding: 0,
  }),
  placeholder: (base) => ({
    ...base,
    color: "#6c757d",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#333",
  }),
};

export default function AddUpdateMeeting({
  onClose,
  onSuccess,
  meetingData = null,
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [filteredCourses, setFilteredCourses] = useState([]);

  // Fetch courses
  const { data: coursesData } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers-all"],
    queryFn: () => fetchTeachers({ page: 1, limit: 500 }),
    enabled: isAdmin,
  });

  const allCourses = coursesData || [];
  const teachers = teachersData?.data || [];
  const teacherId = user?.id || user?._id || "";
  const effectiveTeacherId = isAdmin ? selectedTeacherId : teacherId;

  // Filter courses by logged in teacher
  useEffect(() => {
    if (effectiveTeacherId) {
      const filtered = allCourses.filter((course) => {
        const legacyTeacherId =
          typeof course.teacher === "string"
            ? course.teacher
            : course.teacher?._id;

        const assignedTeacherIds = Array.isArray(course.teachers)
          ? course.teachers.map((teacher) =>
              typeof teacher === "string" ? teacher : teacher?._id,
            )
          : [];

        return (
          legacyTeacherId === effectiveTeacherId ||
          assignedTeacherIds.includes(effectiveTeacherId)
        );
      });
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses([]);
    }
  }, [effectiveTeacherId, allCourses]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(createMeetingSchema),
    defaultValues: meetingData || {
      title: "",
      teacher: effectiveTeacherId,
      course: "",
      date: "",
      startTime: "",
      endTime: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (effectiveTeacherId) {
      setValue("teacher", effectiveTeacherId);
    }
  }, [effectiveTeacherId, setValue]);

  // Populate form when editing
  useEffect(() => {
    if (meetingData) {
      setValue("title", meetingData.title || "");
      setValue("notes", meetingData.notes || "");
      setValue(
        "date",
        meetingData.date
          ? new Date(meetingData.date).toISOString().slice(0, 10)
          : "",
      );
      setValue("startTime", meetingData.startTime || "");
      setValue("endTime", meetingData.endTime || "");

      const meetingTeacherId =
        typeof meetingData.teacher === "string"
          ? meetingData.teacher
          : meetingData.teacher?._id;
      const teacherToSet = meetingTeacherId || teacherId;

      if (teacherToSet) {
        setSelectedTeacherId(teacherToSet);
        setValue("teacher", teacherToSet);
      }

      if (meetingData.course) {
        const courseId =
          typeof meetingData.course === "string"
            ? meetingData.course
            : meetingData.course._id;
        setSelectedCourse(courseId);
        setValue("course", courseId);
      }
    }
  }, [meetingData, setValue, teacherId]);

  const addMutation = useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      toast.success("Meeting created successfully!");
      onSuccess();
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create meeting");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMeeting,
    onSuccess: () => {
      toast.success("Meeting updated successfully!");
      onSuccess();
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update meeting");
    },
  });

  const onSubmit = async (data) => {
    try {
      if (meetingData) {
        await updateMutation.mutateAsync({
          id: meetingData._id,
          meetingData: data,
        });
      } else {
        await addMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCopyMeetingLink = async () => {
    try {
      if (!meetingData?._id) return;
      const linkData = await generateMeetingLink(meetingData._id);
      const linkToCopy = linkData?.meetingLink || linkData?.joinUrl;

      if (!linkToCopy) {
        toast.error("Meeting link is not available");
        return;
      }

      navigator.clipboard.writeText(linkToCopy);
      toast.success("Meeting link copied to clipboard!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate meeting link",
      );
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
              {meetingData ? "Update Meeting" : "Schedule New Meeting"}
            </h5>
            <button
              type="button"
              className={`btn-close btn-close-white ${modalStyles.closeButton}`}
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={`modal-body ${modalStyles.modalBody}`}>
              <div className="row">
                {/* Title */}
                <div className="col-12 mb-3">
                  <FormField
                    label="Meeting Title"
                    name="title"
                    control={control}
                    errors={errors}
                    placeholder="Enter meeting title"
                    required
                  />
                </div>

                {/* Teacher Selection */}
                {isAdmin ? (
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-bold">
                      Teacher <span className="text-danger">*</span>
                    </label>
                    <Controller
                      name="teacher"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={teachers.map((teacher) => ({
                            value: teacher._id,
                            label: teacher.name,
                          }))}
                          value={
                            field.value
                              ? {
                                  value: field.value,
                                  label:
                                    teachers.find((t) => t._id === field.value)
                                      ?.name || "",
                                }
                              : null
                          }
                          onChange={(option) => {
                            const value = option ? option.value : "";
                            setSelectedTeacherId(value);
                            setSelectedCourse(null);
                            setValue("course", "");
                            field.onChange(value);
                          }}
                          isClearable
                          placeholder="Select teacher"
                          styles={selectStyles}
                        />
                      )}
                    />
                    {errors.teacher && (
                      <div className="invalid-feedback d-block">
                        {errors.teacher.message}
                      </div>
                    )}
                  </div>
                ) : (
                  <Controller
                    name="teacher"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="hidden"
                        {...field}
                        value={effectiveTeacherId}
                      />
                    )}
                  />
                )}

                {/* Course Selection */}
                <div className="col-md-12 mb-3">
                  <label className="form-label fw-bold">
                    Course <span className="text-danger">*</span>
                  </label>
                  <Controller
                    name="course"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={filteredCourses.map((course) => ({
                          value: course._id,
                          label: `${course.title}`,
                        }))}
                        value={
                          selectedCourse
                            ? {
                                value: selectedCourse,
                                label: filteredCourses.find(
                                  (c) => c._id === selectedCourse,
                                )
                                  ? `${filteredCourses.find((c) => c._id === selectedCourse).title}`
                                  : "",
                              }
                            : null
                        }
                        onChange={(option) => {
                          const value = option ? option.value : null;
                          setSelectedCourse(value);
                          field.onChange(value);
                        }}
                        isClearable
                        placeholder={
                          isAdmin && !selectedTeacherId
                            ? "Select teacher first"
                            : "Select your course"
                        }
                        isDisabled={isAdmin && !selectedTeacherId}
                        styles={selectStyles}
                      />
                    )}
                  />
                  {errors.course && (
                    <div className="invalid-feedback d-block">
                      {errors.course.message}
                    </div>
                  )}
                  <small className="text-muted">
                    Only assigned courses for the selected teacher are shown
                  </small>
                </div>

                {/* Date */}
                <div className="col-md-6 mb-3">
                  <FormField
                    label="Date"
                    name="date"
                    control={control}
                    errors={errors}
                    type="date"
                    required
                  />
                </div>

                {/* Start Time */}
                <div className="col-md-6 mb-3">
                  <FormField
                    label="Start Time"
                    name="startTime"
                    control={control}
                    errors={errors}
                    type="time"
                    required
                  />
                </div>

                {/* End Time */}
                <div className="col-md-6 mb-3">
                  <FormField
                    label="End Time"
                    name="endTime"
                    control={control}
                    errors={errors}
                    type="time"
                    required
                  />
                </div>

                {/* Notes */}
                <div className="col-12 mb-3">
                  <TextareaField
                    label="Notes"
                    name="notes"
                    control={control}
                    errors={errors}
                    placeholder="Add any notes or details about the meeting"
                  />
                </div>

                {/* Meeting Link (Display only if editing) */}
                {meetingData?._id && (
                  <div className="col-12 mb-3">
                    <label className={styles.meetingLinkLabel}>
                      Meeting Link
                    </label>
                    <div className={styles.meetingLinkContainer}>
                      <button
                        type="button"
                        className={styles.copyButton}
                        onClick={handleCopyMeetingLink}
                      >
                        Generate & Copy Link
                      </button>
                    </div>
                    <small className={styles.noteText}>
                      Click to generate and copy the meeting link
                    </small>
                  </div>
                )}
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
                {meetingData ? "Update Meeting" : "Schedule Meeting"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
