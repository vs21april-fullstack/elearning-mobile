import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import {
  getStudentCourses,
  enrollStudentInCourse,
  unenrollStudentFromCourse,
} from "../students.api";
import { fetchTeachers } from "../../teachers/teachers.api";
import { fetchCoursesByTeacher } from "../../courses/courses.api";
import toast from "react-hot-toast";
import Button from "../../../components/Button";
import modalStyles from "../../../components/Modal.module.css";
import styles from "./ManageCourses.module.css";

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

export default function ManageCourses({ student, onClose }) {
  const queryClient = useQueryClient();
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch student's enrolled courses
  const { data: enrolledCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ["studentCourses", student._id],
    queryFn: () => getStudentCourses(student._id),
    enabled: !!student._id,
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => fetchTeachers({ page: 1, limit: 1000 }),
  });

  const { data: teacherCoursesData, isLoading: teacherCoursesLoading } =
    useQuery({
      queryKey: ["teacherCourses", selectedTeacher],
      queryFn: () => fetchCoursesByTeacher(selectedTeacher),
      enabled: !!selectedTeacher,
    });

  const allTeachers = teachersData?.data || [];
  const teacherCourses = teacherCoursesData || [];
  const studentCourses = enrolledCourses || [];

  // Filter to only show active enrollments (not dropped)
  const activeCourses = studentCourses.filter(
    (enrollment) => enrollment.status !== "dropped",
  );

  // Get enrolled course IDs (only active ones)
  const enrolledCourseIds = activeCourses.map((enrollment) =>
    typeof enrollment.course === "string"
      ? enrollment.course
      : enrollment.course._id,
  );

  const teacherOptions = allTeachers.filter((teacher) => teacher.isActive);

  const availableCourses = selectedTeacher
    ? teacherCourses.filter((course) => !enrolledCourseIds.includes(course._id))
    : [];

  const enrollMutation = useMutation({
    mutationFn: enrollStudentInCourse,
    onSuccess: () => {
      toast.success("Course enrolled successfully!");
      queryClient.invalidateQueries({
        queryKey: ["studentCourses", student._id],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-courses", student._id],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setSelectedCourse(null);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to enroll in course",
      );
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: unenrollStudentFromCourse,
    onSuccess: () => {
      toast.success("Course unenrolled successfully!");
      queryClient.invalidateQueries({
        queryKey: ["studentCourses", student._id],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-courses", student._id],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to unenroll from course",
      );
    },
  });

  const handleEnroll = () => {
    if (selectedTeacher && selectedCourse) {
      enrollMutation.mutate({
        userId: student._id,
        courseId: selectedCourse,
        teacherId: selectedTeacher,
      });
    }
  };

  const handleUnenroll = (courseId) => {
    if (confirm("Are you sure you want to unenroll from this course?")) {
      unenrollMutation.mutate({
        userId: student._id,
        courseId,
      });
    }
  };

  return (
    <div className={`modal d-block ${modalStyles.modalOverlay}`}>
      <div className={`modal-dialog modal-lg ${modalStyles.modalDialog}`}>
        <div
          className={`modal-content glass-card animate-fade-in ${modalStyles.modalContent}`}
        >
          <div className={`modal-header border-0 ${modalStyles.modalHeader}`}>
            <h5 className={`modal-title fw-bold ${modalStyles.modalTitle}`}>
              Manage Courses - {student.name}
            </h5>
            <button
              type="button"
              className={`${modalStyles.closeButton} btn-close btn-close-white`}
              onClick={onClose}
            ></button>
          </div>

          <div className={`modal-body ${modalStyles.modalBody}`}>
            {/* Add Course Section */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Enroll in Additional Course</h6>
              <div className="row align-items-end">
                <div className="col-md-6">
                  <label className="form-label">Select Teacher</label>
                  <Select
                    options={teacherOptions.map((teacher) => ({
                      value: teacher._id,
                      label: `${teacher.name} (${teacher.email})`,
                    }))}
                    value={
                      selectedTeacher
                        ? {
                            value: selectedTeacher,
                            label: teacherOptions.find(
                              (t) => t._id === selectedTeacher,
                            )
                              ? `${teacherOptions.find((t) => t._id === selectedTeacher).name} (${teacherOptions.find((t) => t._id === selectedTeacher).email})`
                              : "",
                          }
                        : null
                    }
                    onChange={(option) => {
                      setSelectedTeacher(option ? option.value : null);
                      setSelectedCourse(null);
                    }}
                    isClearable
                    placeholder="Select teacher first"
                    styles={selectStyles}
                    noOptionsMessage={() => "No teachers found"}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Select Course</label>
                  <Select
                    options={availableCourses.map((course) => ({
                      value: course._id,
                      label: `${course.title}`,
                    }))}
                    value={
                      selectedCourse
                        ? {
                            value: selectedCourse,
                            label: availableCourses.find(
                              (c) => c._id === selectedCourse,
                            )
                              ? `${availableCourses.find((c) => c._id === selectedCourse).title}`
                              : "",
                          }
                        : null
                    }
                    onChange={(option) =>
                      setSelectedCourse(option ? option.value : null)
                    }
                    isClearable
                    isDisabled={!selectedTeacher}
                    isLoading={teacherCoursesLoading}
                    placeholder={
                      selectedTeacher
                        ? "Select a course to enroll"
                        : "Choose teacher to see courses"
                    }
                    styles={selectStyles}
                    noOptionsMessage={() =>
                      selectedTeacher
                        ? "No courses found for selected teacher"
                        : "Choose teacher first"
                    }
                  />
                </div>

                <div className="col-md-2">
                  <Button
                    variant="primary"
                    onClick={handleEnroll}
                    disabled={
                      !selectedTeacher ||
                      !selectedCourse ||
                      enrollMutation.isPending
                    }
                    loading={enrollMutation.isPending}
                  >
                    Enroll
                  </Button>
                </div>
              </div>
            </div>

            <hr />

            {/* Enrolled Courses List */}
            <div>
              <h6 className="fw-bold mb-3">Enrolled Courses</h6>
              {coursesLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : activeCourses.length === 0 ? (
                <p className="text-muted">No courses enrolled yet.</p>
              ) : (
                <div className={styles.coursesList}>
                  {activeCourses.map((enrollment) => {
                    const course =
                      typeof enrollment.course === "object"
                        ? enrollment.course
                        : null;
                    const teacher =
                      typeof enrollment.teacher === "object"
                        ? enrollment.teacher
                        : null;
                    if (!course) return null;

                    return (
                      <div key={enrollment._id} className={styles.courseCard}>
                        <div className={styles.courseInfo}>
                          <h6 className={styles.courseTitle}>{course.title}</h6>
                          <p className={styles.classLabel}>
                            Teacher: {teacher?.name || "Not assigned"}
                          </p>
                          <div className={styles.courseMeta}>
                            <span
                              className={`${styles.statusBadge} ${
                                enrollment.status === "enrolled" ||
                                enrollment.status === "in-progress"
                                  ? styles.statusActive
                                  : enrollment.status === "completed"
                                    ? styles.statusCompleted
                                    : ""
                              }`}
                            >
                              {enrollment.status.charAt(0).toUpperCase() +
                                enrollment.status.slice(1)}
                            </span>
                          </div>
                          {enrollment.progress > 0 && (
                            <div className={styles.progress}>
                              <div
                                className={styles.progressBar}
                                style={{ width: `${enrollment.progress}%` }}
                              >
                                {enrollment.progress}%
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={styles.courseActions}>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleUnenroll(course._id)}
                            disabled={unenrollMutation.isPending}
                          >
                            Unenroll
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={`modal-footer border-0 ${modalStyles.modalFooter}`}>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
