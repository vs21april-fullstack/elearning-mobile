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
    border: state.isFocused ? "2px solid #667eea" : "1px solid #dee2e6",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(102, 126, 234, 0.1)" : "none",
    padding: "6px 8px",
    background: "white",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#667eea",
    },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#667eea"
      : state.isFocused
        ? "#f0f2ff"
        : "white",
    color: state.isSelected ? "white" : "#333",
    padding: "12px 16px",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#667eea",
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
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filteredCourses, setFilteredCourses] = useState([]);

  // Fetch courses
  const { data: coursesData } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const allCourses = coursesData || [];
  const teacherId = user?.id || "";

  // Filter courses by logged in teacher
  useEffect(() => {
    if (teacherId) {
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
          legacyTeacherId === teacherId ||
          assignedTeacherIds.includes(teacherId)
        );
      });
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses([]);
    }
  }, [teacherId, allCourses]);

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
      teacher: teacherId,
      course: "",
      date: "",
      startTime: "",
      endTime: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (teacherId) {
      setValue("teacher", teacherId);
    }
  }, [teacherId, setValue]);

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

      setValue("teacher", teacherId);

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
                <Controller
                  name="teacher"
                  control={control}
                  render={({ field }) => (
                    <input type="hidden" {...field} value={teacherId} />
                  )}
                />

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
                        placeholder="Select your course"
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
                    Only your assigned courses are shown
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
                        📋 Generate & Copy Link
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
