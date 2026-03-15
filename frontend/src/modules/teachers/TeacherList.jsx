import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTeachers, fetchTeacherById, deleteTeacher } from "./teachers.api";
import { getTeacherColumns } from "./teachers.columns";
import DataTable from "../../components/DataTable";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/Pagination";
import Button from "../../components/Button";
import AddUpdateTeacher from "./components/AddUpdateTeacher";
import ManageTeacherCourses from "./components/ManageTeacherCourses";
import toast from "react-hot-toast";
import styles from "./TeachersList.module.css";

export default function TeacherList() {
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [assignTeacher, setAssignTeacher] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["teachers", page],
    queryFn: () => fetchTeachers({ page, limit }),
    keepPreviousData: true,
  });

  const teachers = useMemo(() => data?.data || [], [data?.data]);
  const pagination = useMemo(() => data?.pagination || {}, [data?.pagination]);

  const deleteMutation = useMutation({
    mutationFn: deleteTeacher,
    onSuccess: () => {
      toast.success("Teacher deleted successfully!");
      queryClient.invalidateQueries(["teachers"]);
      setPage(1); // Reset to first page after deletion
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete teacher");
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

  const handleDelete = useCallback(
    async (teacher) => {
      if (window.confirm(`Are you sure you want to delete ${teacher.name}?`)) {
        await deleteMutation.mutateAsync(teacher._id);
      }
    },
    [deleteMutation],
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
    () => getTeacherColumns(handleEdit, handleDelete, handleAssign),
    [handleEdit, handleDelete, handleAssign],
  );

  return (
    <div className={`container-fluid py-4 ${styles.container}`}>
      <div className={`animate-fade-in ${styles.heroBanner}`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className={`fw-bold mb-2 ${styles.heroTitle}`}>
              👨‍🏫 Teachers Management
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
                    data={teachers}
                    emptyStateType="teachers"
                    emptyStateTitle="No Teachers Found"
                    emptyStateMessage="Start building your teaching team by adding teachers to the platform."
                  />
                </div>
                {pagination.totalPages > 1 && (
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
