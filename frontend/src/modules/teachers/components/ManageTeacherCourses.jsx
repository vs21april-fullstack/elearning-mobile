import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import {
  assignTeacherToCourses,
  fetchCourses,
  fetchCoursesByTeacher,
} from "../../courses/courses.api";
import toast from "react-hot-toast";
import Button from "../../../components/Button";
import modalStyles from "../../../components/Modal.module.css";
import styles from "./ManageTeacherCourses.module.css";

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
};

export default function ManageTeacherCourses({ teacher, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignedCourseIds, setAssignedCourseIds] = useState([]);

  const { data: allCoursesData } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const { data: teacherCourses = [], isLoading: assignedLoading } = useQuery({
    queryKey: ["teacherCourses", teacher?._id],
    queryFn: () => fetchCoursesByTeacher(teacher._id),
    enabled: !!teacher?._id,
  });

  const allCourses = allCoursesData?.data || [];

  useEffect(() => {
    if (teacherCourses.length > 0) {
      setAssignedCourseIds(teacherCourses.map((course) => course._id));
    } else {
      setAssignedCourseIds([]);
    }
  }, [teacherCourses]);

  const assignedCourses = useMemo(
    () => allCourses.filter((course) => assignedCourseIds.includes(course._id)),
    [allCourses, assignedCourseIds],
  );

  const availableCourses = useMemo(
    () =>
      allCourses.filter((course) => !assignedCourseIds.includes(course._id)),
    [allCourses, assignedCourseIds],
  );

  const assignMutation = useMutation({
    mutationFn: assignTeacherToCourses,
    onSuccess: () => {
      toast.success("Courses assigned successfully!");
      queryClient.invalidateQueries({
        queryKey: ["teacher-courses", teacher?._id],
      });
      queryClient.invalidateQueries({
        queryKey: ["teacherCourses", teacher?._id],
      });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      onSuccess?.();
      onClose?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to assign courses");
    },
  });

  const handleAdd = () => {
    if (!selectedCourse) return;
    setAssignedCourseIds((prev) => [...prev, selectedCourse]);
    setSelectedCourse(null);
  };

  const handleRemove = (courseId) => {
    setAssignedCourseIds((prev) => prev.filter((id) => id !== courseId));
  };

  const handleSave = () => {
    assignMutation.mutate({
      teacherId: teacher._id,
      courseIds: assignedCourseIds,
    });
  };

  return (
    <div className={`modal d-block ${modalStyles.modalOverlay}`}>
      <div className={`modal-dialog modal-lg ${modalStyles.modalDialog}`}>
        <div
          className={`modal-content glass-card animate-fade-in ${modalStyles.modalContent}`}
        >
          <div className={`modal-header border-0 ${modalStyles.modalHeader}`}>
            <h5 className={`modal-title fw-bold ${modalStyles.modalTitle}`}>
              Assign Courses - {teacher?.name}
            </h5>
            <button
              type="button"
              className={`${modalStyles.closeButton} btn-close btn-close-white`}
              onClick={onClose}
            ></button>
          </div>

          <div className={`modal-body ${modalStyles.modalBody}`}>
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Add Course</h6>
              <div className="row align-items-end">
                <div className="col-md-9">
                  <Select
                    options={availableCourses.map((course) => ({
                      value: course._id,
                      label: course.title,
                    }))}
                    value={
                      selectedCourse
                        ? {
                            value: selectedCourse,
                            label:
                              availableCourses.find(
                                (course) => course._id === selectedCourse,
                              )?.title || "",
                          }
                        : null
                    }
                    onChange={(option) =>
                      setSelectedCourse(option?.value || null)
                    }
                    isClearable
                    placeholder="Select a course"
                    styles={selectStyles}
                  />
                </div>
                <div className="col-md-3 col-12 mt-3 mt-md-0 d-grid">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-100"
                    onClick={handleAdd}
                    disabled={!selectedCourse}
                  >
                    Add Course
                  </Button>
                </div>
              </div>
            </div>

            <hr />

            <div>
              <h6 className="fw-bold mb-3">Assigned Courses</h6>
              {assignedLoading ? (
                <p className="text-muted mb-0">Loading assigned courses...</p>
              ) : assignedCourses.length === 0 ? (
                <p className="text-muted mb-0">No courses assigned yet.</p>
              ) : (
                <div className={styles.courseList}>
                  {assignedCourses.map((course) => (
                    <div key={course._id} className={styles.courseItem}>
                      <span className={styles.courseTitle}>{course.title}</span>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => handleRemove(course._id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={`modal-footer border-0 ${modalStyles.modalFooter}`}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={assignMutation.isPending}
              disabled={assignMutation.isPending}
            >
              Save Assignments
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
