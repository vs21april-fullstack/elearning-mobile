import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchStudents, fetchStudentById, updateStudent } from "./students.api";
import { fetchCourses } from "../courses/courses.api";
import { getStudentColumns } from "./students.columns";
import Select from "react-select";
import DataTable from "../../components/DataTable";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/Pagination";
import AddUpdateStudent from "./components/AddUpdateStudent";
import ManageCourses from "./components/ManageCourses";
import Button from "../../components/Button";
import { useConfirm } from "../../app/confirmContext";
import StudentIcon from "../../assets/svg/StudentIcon";
import toast from "react-hot-toast";
import styles from "./StudentList.module.css";

export default function StudentList() {
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showManageCourses, setShowManageCourses] = useState(false);
  const [studentForCourses, setStudentForCourses] = useState(null);
  const [page, setPage] = useState(1);
  const [filterCourses, setFilterCourses] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const limit = 10;
  const confirm = useConfirm();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["students", page],
    queryFn: () => fetchStudents({ page, limit }),
    keepPreviousData: true,
  });

  const { data: allCoursesData } = useQuery({
    queryKey: ["courses-all"],
    queryFn: () => fetchCourses({ page: 1, limit: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const students = useMemo(() => data?.data || [], [data?.data]);
  const pagination = useMemo(() => data?.pagination || {}, [data?.pagination]);
  const allCourses = useMemo(
    () => allCoursesData?.data ?? [],
    [allCoursesData],
  );

  const teacherOptions = useMemo(() => {
    const unique = new Map();

    allCourses.forEach((course) => {
      const teachers = [
        ...(course?.teacher ? [course.teacher] : []),
        ...(Array.isArray(course?.teachers) ? course.teachers : []),
      ];

      teachers.forEach((teacher) => {
        const id = String(teacher?._id || teacher || "");
        if (!id || unique.has(id)) return;
        unique.set(id, {
          value: id,
          label: teacher?.email
            ? `${teacher?.name || "Teacher"} (${teacher.email})`
            : teacher?.name || "Teacher",
        });
      });
    });

    return Array.from(unique.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [allCourses]);

  const selectedTeacherCourseIds = useMemo(() => {
    if (!selectedTeacherId) return new Set();

    const ids = new Set();
    allCourses.forEach((course) => {
      const teachers = [
        ...(course?.teacher ? [course.teacher] : []),
        ...(Array.isArray(course?.teachers) ? course.teachers : []),
      ];

      const hasTeacher = teachers.some((teacher) => {
        const id = String(teacher?._id || teacher || "");
        return id === selectedTeacherId;
      });

      if (hasTeacher) {
        ids.add(String(course._id));
      }
    });

    return ids;
  }, [allCourses, selectedTeacherId]);

  // Filter students by selected courses (client-side on current page)
  const filteredStudents = useMemo(() => {
    const courseIds = new Set(filterCourses.map((o) => o.value));

    return students.filter((student) => {
      const enrolledIds = (student.enrolledCourses || []).map((course) =>
        String(course._id),
      );

      const matchesCourse =
        !filterCourses.length ||
        enrolledIds.some((courseId) => courseIds.has(courseId));

      const matchesTeacher =
        !selectedTeacherId ||
        enrolledIds.some((courseId) => selectedTeacherCourseIds.has(courseId));

      return matchesCourse && matchesTeacher;
    });
  }, [students, filterCourses, selectedTeacherId, selectedTeacherCourseIds]);

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) =>
      updateStudent({ id, studentData: { isActive } }),
    onSuccess: () => {
      toast.success("Student status updated successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update student status",
      );
    },
  });

  const handleEdit = useCallback(async (student) => {
    try {
      toast.loading("Loading student details...", { id: "fetch-student" });
      const studentData = await fetchStudentById(student._id);
      toast.dismiss("fetch-student");
      setSelectedStudent(studentData);
      setShowForm(true);
    } catch (error) {
      toast.dismiss("fetch-student");
      toast.error(
        error.response?.data?.message || "Failed to fetch student details",
      );
    }
  }, []);

  const handleToggleStatus = useCallback(
    async (student) => {
      const confirmed = await confirm({
        title: student.isActive ? "Set Student Inactive" : "Set Student Active",
        message: student.isActive
          ? `Are you sure you want to set ${student.name} as inactive?`
          : `Are you sure you want to set ${student.name} as active?`,
        confirmText: student.isActive ? "Set Inactive" : "Set Active",
        confirmVariant: "danger",
      });

      if (confirmed) {
        toggleStatusMutation.mutate({
          id: student._id,
          isActive: !student.isActive,
        });
      }
    },
    [confirm, toggleStatusMutation],
  );

  const handleManageCourses = useCallback((student) => {
    setStudentForCourses(student);
    setShowManageCourses(true);
  }, []);

  const columns = useMemo(
    () =>
      getStudentColumns(handleEdit, handleToggleStatus, handleManageCourses),
    [handleEdit, handleToggleStatus, handleManageCourses],
  );

  const handleAddNew = useCallback(() => {
    setSelectedStudent(null);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedStudent(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className={`container-fluid py-4 ${styles.container}`}>
      <div className={`animate-fade-in ${styles.heroBanner}`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className={`fw-bold mb-2 ${styles.heroTitle}`}>
              <span className="d-inline-flex align-items-center gap-2">
                <StudentIcon size={22} color="white" />
                Students Management
              </span>
            </h2>
            <p className={`mb-0 ${styles.heroSubtitle}`}>
              Manage and view all student information
            </p>
          </div>
          <Button variant="primary" onClick={handleAddNew}>
            <i className="bi bi-plus-lg"></i> Add New Student
          </Button>
        </div>
      </div>

      {/* Course Filter */}
      <div className={`glass-card ${styles.filterBar}`}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Filter by Teacher</label>
          <Select
            options={teacherOptions}
            value={
              selectedTeacherId
                ? teacherOptions.find(
                    (option) => option.value === selectedTeacherId,
                  ) || null
                : null
            }
            onChange={(selected) => setSelectedTeacherId(selected?.value || "")}
            placeholder="Select teacher…"
            isClearable
            classNamePrefix="rs"
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              control: (base, state) => ({
                ...base,
                borderRadius: "10px",
                border: state.isFocused
                  ? "1.5px solid rgba(47,125,87,0.6)"
                  : "1.5px solid rgba(148,163,184,0.4)",
                boxShadow: state.isFocused
                  ? "0 0 0 3px rgba(47,125,87,0.08)"
                  : "none",
                minHeight: "42px",
                fontSize: "0.9rem",
                background: "#fff",
                "&:hover": { borderColor: "rgba(47,125,87,0.5)" },
              }),
              option: (base, state) => ({
                ...base,
                background: state.isSelected
                  ? "#2f7d57"
                  : state.isFocused
                    ? "rgba(47,125,87,0.08)"
                    : "#fff",
                color: state.isSelected ? "#fff" : "#1e293b",
                fontSize: "0.9rem",
                cursor: "pointer",
              }),
              menu: (base) => ({
                ...base,
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                zIndex: 9999,
              }),
            }}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Filter by Course</label>
          <Select
            isMulti
            options={allCourses.map((c) => ({
              value: String(c._id),
              label: c.title,
            }))}
            value={filterCourses}
            onChange={(selected) => setFilterCourses(selected || [])}
            placeholder="Select courses…"
            classNamePrefix="rs"
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              control: (base, state) => ({
                ...base,
                borderRadius: "10px",
                border: state.isFocused
                  ? "1.5px solid rgba(47,125,87,0.6)"
                  : "1.5px solid rgba(148,163,184,0.4)",
                boxShadow: state.isFocused
                  ? "0 0 0 3px rgba(47,125,87,0.08)"
                  : "none",
                minHeight: "42px",
                fontSize: "0.9rem",
                background: "#fff",
                "&:hover": { borderColor: "rgba(47,125,87,0.5)" },
              }),
              multiValue: (base) => ({
                ...base,
                background: "rgba(47,125,87,0.1)",
                borderRadius: "6px",
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: "#2f7d57",
                fontWeight: 600,
                fontSize: "0.78rem",
              }),
              multiValueRemove: (base) => ({
                ...base,
                color: "#2f7d57",
                "&:hover": {
                  background: "rgba(47,125,87,0.2)",
                  color: "#1e5f42",
                },
              }),
              option: (base, state) => ({
                ...base,
                background: state.isSelected
                  ? "#2f7d57"
                  : state.isFocused
                    ? "rgba(47,125,87,0.08)"
                    : "#fff",
                color: state.isSelected ? "#fff" : "#1e293b",
                fontSize: "0.9rem",
                cursor: "pointer",
              }),
              menu: (base) => ({
                ...base,
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                zIndex: 9999,
              }),
            }}
          />
        </div>
        {(filterCourses.length > 0 || selectedTeacherId) && (
          <button
            className={styles.clearButton}
            onClick={() => {
              setFilterCourses([]);
              setSelectedTeacherId("");
            }}
          >
            ✕ Clear
          </button>
        )}
        {(filterCourses.length > 0 || selectedTeacherId) && (
          <span className={styles.recordsBadge}>
            {filteredStudents.length} Student
            {filteredStudents.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="row">
        <div className="col-12">
          <div className={`glass-card animate-slide-in ${styles.contentCard}`}>
            {isLoading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner />
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <DataTable
                    columns={columns}
                    data={filteredStudents}
                    emptyStateType="students"
                    emptyStateTitle="No Students Found"
                    emptyStateMessage={
                      filterCourses.length
                        ? "No students are enrolled in the selected course(s)."
                        : "Get started by adding your first student to the system."
                    }
                  />
                </div>
                {pagination.totalPages > 1 &&
                  !filterCourses.length &&
                  !selectedTeacherId && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.total}
                      itemsPerPage={limit}
                      onPageChange={setPage}
                      showInfo={true}
                    />
                  )}
              </>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <AddUpdateStudent
          student={selectedStudent}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {showManageCourses && studentForCourses && (
        <ManageCourses
          student={studentForCourses}
          onClose={() => {
            setShowManageCourses(false);
            setStudentForCourses(null);
          }}
        />
      )}
    </div>
  );
}
