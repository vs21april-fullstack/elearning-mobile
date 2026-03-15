import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchStudents, fetchStudentById, deleteStudent } from "./students.api";
import { getStudentColumns } from "./students.columns";
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
  const limit = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["students", page],
    queryFn: () => fetchStudents({ page, limit }),
    keepPreviousData: true,
  });

  const students = useMemo(() => data?.data || [], [data?.data]);
  const pagination = useMemo(() => data?.pagination || {}, [data?.pagination]);

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
                    data={students}
                    emptyStateType="students"
                    emptyStateTitle="No Students Found"
                    emptyStateMessage="Get started by adding your first student to the system."
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
