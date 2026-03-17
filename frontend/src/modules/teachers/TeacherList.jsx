import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTeachers, fetchTeacherById, updateTeacher } from "./teachers.api";
import { fetchCourses } from "../courses/courses.api";
import { getTeacherColumns } from "./teachers.columns";
import Select from "react-select";
import DataTable from "../../components/DataTable";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/Pagination";
import Button from "../../components/Button";
import { useConfirm } from "../../app/confirmContext";
import AddUpdateTeacher from "./components/AddUpdateTeacher";
import ManageTeacherCourses from "./components/ManageTeacherCourses";
import TeacherIcon from "../../assets/svg/TeacherIcon";
import toast from "react-hot-toast";
import styles from "./TeachersList.module.css";

export default function TeacherList() {
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [assignTeacher, setAssignTeacher] = useState(null);
  const [page, setPage] = useState(1);
  const [filterCourses, setFilterCourses] = useState([]);
  const [emailFilter, setEmailFilter] = useState("");
  const limit = 10;
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data, isLoading } = useQuery({
    queryKey: ["teachers", page],
    queryFn: () => fetchTeachers({ page, limit }),
    keepPreviousData: true,
  });

  const { data: allCoursesData } = useQuery({
    queryKey: ["courses-all"],
    queryFn: () => fetchCourses({ page: 1, limit: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const teachers = useMemo(() => data?.data || [], [data?.data]);
  const pagination = useMemo(() => data?.pagination || {}, [data?.pagination]);
  const allCourses = useMemo(
    () => allCoursesData?.data ?? [],
    [allCoursesData],
  );

  // assignedCourses is embedded directly on each teacher by the list API

  // Filter teachers by selected courses (client-side)
  const filteredTeachers = useMemo(() => {
    const normalizedEmail = emailFilter.trim().toLowerCase();
    const courseIds = new Set(filterCourses.map((o) => o.value));

    return teachers.filter((teacher) => {
      const matchesCourse =
        !filterCourses.length ||
        (teacher.assignedCourses || []).some((course) =>
          courseIds.has(String(course._id)),
        );

      const matchesEmail =
        !normalizedEmail ||
        String(teacher.email || "")
          .toLowerCase()
          .includes(normalizedEmail);

      return matchesCourse && matchesEmail;
    });
  }, [teachers, filterCourses, emailFilter]);

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) =>
      updateTeacher({ id, teacherData: { isActive } }),
    onSuccess: () => {
      toast.success("Teacher status updated successfully!");
      queryClient.invalidateQueries(["teachers"]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update teacher status",
      );
    },
  });

  const handleAdd = useCallback(() => {
    setSelectedTeacher(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback(async (teacher) => {
    try {
      toast.loading("Loading teacher details...", { id: "fetch-teacher" });
      const teacherData = await fetchTeacherById(teacher._id);
      toast.dismiss("fetch-teacher");
      setSelectedTeacher(teacherData);
      setShowModal(true);
    } catch (error) {
      toast.dismiss("fetch-teacher");
      toast.error(
        error.response?.data?.message || "Failed to fetch teacher details",
      );
    }
  }, []);

  const handleToggleStatus = useCallback(
    async (teacher) => {
      const confirmed = await confirm({
        title: teacher.isActive ? "Set Teacher Inactive" : "Set Teacher Active",
        message: teacher.isActive
          ? `Are you sure you want to set ${teacher.name} as inactive?`
          : `Are you sure you want to set ${teacher.name} as active?`,
        confirmText: teacher.isActive ? "Set Inactive" : "Set Active",
        confirmVariant: "danger",
      });

      if (confirmed) {
        await toggleStatusMutation.mutateAsync({
          id: teacher._id,
          isActive: !teacher.isActive,
        });
      }
    },
    [confirm, toggleStatusMutation],
  );

  const handleAssign = useCallback((teacher) => {
    setAssignTeacher(teacher);
    setShowAssignModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setSelectedTeacher(null);
  }, []);

  const handleAssignModalClose = useCallback(() => {
    setShowAssignModal(false);
    setAssignTeacher(null);
  }, []);

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries(["teachers"]);
  }, [queryClient]);

  const columns = useMemo(
    () => getTeacherColumns(handleEdit, handleToggleStatus, handleAssign),
    [handleEdit, handleToggleStatus, handleAssign],
  );

  return (
    <div className={`container-fluid py-4 ${styles.container}`}>
      <div className={`animate-fade-in ${styles.heroBanner}`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className={`fw-bold mb-2 ${styles.heroTitle}`}>
              <span className="d-inline-flex align-items-center gap-2">
                <TeacherIcon size={22} color="white" />
                Teachers Management
              </span>
            </h2>
            <p className={`mb-0 ${styles.heroSubtitle}`}>
              Manage and view all teacher information
            </p>
          </div>
          <Button variant="primary" onClick={handleAdd}>
            + Add Teacher
          </Button>
        </div>
      </div>

      {/* Course Filter */}
      <div className={`glass-card ${styles.filterBar}`}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Filter by Email</label>
          <input
            type="text"
            value={emailFilter}
            onChange={(event) => setEmailFilter(event.target.value)}
            placeholder="Search by teacher email"
            className={styles.filterSelect}
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
        {(filterCourses.length > 0 || emailFilter.trim()) && (
          <button
            className={styles.clearButton}
            onClick={() => {
              setFilterCourses([]);
              setEmailFilter("");
            }}
          >
            ✕ Clear
          </button>
        )}
        {(filterCourses.length > 0 || emailFilter.trim()) && (
          <span className={styles.recordsBadge}>
            {filteredTeachers.length} Teacher
            {filteredTeachers.length !== 1 ? "s" : ""}
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
                    data={filteredTeachers}
                    emptyStateType="teachers"
                    emptyStateTitle="No Teachers Found"
                    emptyStateMessage={
                      filterCourses.length
                        ? "No teachers are assigned to the selected course(s)."
                        : "Start building your teaching team by adding teachers to the platform."
                    }
                  />
                </div>
                {pagination.totalPages > 1 &&
                  !filterCourses.length &&
                  !emailFilter.trim() && (
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

      {showModal && (
        <AddUpdateTeacher
          teacher={selectedTeacher}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}

      {showAssignModal && assignTeacher && (
        <ManageTeacherCourses
          teacher={assignTeacher}
          onClose={handleAssignModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
