import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchStudents, fetchStudentById, deleteStudent } from "./students.api";
import { fetchCourses } from "../courses/courses.api";
import { getStudentColumns } from "./students.columns";
import Select from "react-select";
import DataTable from "../../components/DataTable";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/Pagination";
import AddUpdateStudent from "./components/AddUpdateStudent";
import ManageCourses from "./components/ManageCourses";
import Button from "../../components/Button";
import toast from "react-hot-toast";
import styles from "./StudentList.module.css";

export default function StudentList() {
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showManageCourses, setShowManageCourses] = useState(false);
  const [studentForCourses, setStudentForCourses] = useState(null);
  const [page, setPage] = useState(1);
  const [filterCourses, setFilterCourses] = useState([]);
  const limit = 10;

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

  // enrolledCourses is embedded directly on each student by the list API

  // Filter students by selected courses (client-side on current page)
  const filteredStudents = useMemo(() => {
    if (!filterCourses.length) return students;
    const ids = new Set(filterCourses.map((o) => o.value));
    return students.filter((s) =>
      (s.enrolledCourses || []).some((c) => ids.has(String(c._id))),
    );
  }, [students, filterCourses]);

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      toast.success("Student deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete student");
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

  const handleDelete = useCallback(
    (student) => {
      if (
        window.confirm(
          `Are you sure you want to delete ${student.name}? This action cannot be undone.`,
        )
      ) {
        deleteMutation.mutate(student._id);
      }
    },
    [deleteMutation],
  );

  const handleManageCourses = useCallback((student) => {
    setStudentForCourses(student);
    setShowManageCourses(true);
  }, []);

  const columns = useMemo(
    () => getStudentColumns(handleEdit, handleDelete, handleManageCourses),
    [handleEdit, handleDelete, handleManageCourses],
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
              🎓 Students Management
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
        {filterCourses.length > 0 && (
          <button
            className={styles.clearButton}
            onClick={() => setFilterCourses([])}
          >
            ✕ Clear
          </button>
        )}
        {filterCourses.length > 0 && (
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
                {pagination.totalPages > 1 && !filterCourses.length && (
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
