import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCourses, fetchCourseById, deleteCourse } from "./courses.api";
import { getCourseColumns } from "./courses.columns";
import DataTable from "../../components/DataTable";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/Pagination";
import Button from "../../components/Button";
import { useConfirm } from "../../app/confirmContext";
import AddUpdateCourse from "./components/AddUpdateCourse";
import CourseIcon from "../../assets/svg/CourseIcon";
import toast from "react-hot-toast";
import styles from "./CoursesList.module.css";

export default function CourseList() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data, isLoading } = useQuery({
    queryKey: ["courses", page],
    queryFn: () => fetchCourses({ page, limit }),
    keepPreviousData: true,
  });

  const courses = useMemo(() => data?.data || [], [data?.data]);
  const pagination = useMemo(() => data?.pagination || {}, [data?.pagination]);

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      toast.success("Course deleted successfully!");
      queryClient.invalidateQueries(["courses"]);
      setPage(1);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete course");
    },
  });

  const handleAdd = useCallback(() => {
    setSelectedCourse(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback(async (courseData) => {
    try {
      toast.loading("Loading course details...", { id: "fetch-course" });
      const courseDetails = await fetchCourseById(courseData._id);
      toast.dismiss("fetch-course");
      setSelectedCourse(courseDetails);
      setShowModal(true);
    } catch (error) {
      toast.dismiss("fetch-course");
      toast.error(
        error.response?.data?.message || "Failed to fetch course details",
      );
    }
  }, []);

  const handleDelete = useCallback(
    async (courseData) => {
      const confirmed = await confirm({
        title: "Delete Course",
        message: `Are you sure you want to delete ${courseData.title}?`,
        confirmText: "Delete",
        confirmVariant: "danger",
      });

      if (confirmed) {
        await deleteMutation.mutateAsync(courseData._id);
      }
    },
    [confirm, deleteMutation],
  );

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setSelectedCourse(null);
  }, []);

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries(["courses"]);
  }, [queryClient]);

  const columns = useMemo(
    () => getCourseColumns(handleEdit, handleDelete),
    [handleEdit, handleDelete],
  );

  return (
    <div className={`container-fluid py-4 ${styles.container}`}>
      <div className={`animate-fade-in ${styles.heroBanner}`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className={`fw-bold mb-2 ${styles.heroTitle}`}>
              <span className="d-inline-flex align-items-center gap-2">
                <CourseIcon size={22} color="white" />
                Courses Management
              </span>
            </h2>
            <p className={`mb-0 ${styles.heroSubtitle}`}>
              Manage courses, assign teachers, and track curriculum
            </p>
          </div>
          <Button variant="primary" onClick={handleAdd}>
            + Add Course
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
                    data={courses}
                    emptyStateType="courses"
                    emptyStateTitle="No Courses Available"
                    emptyStateMessage="Design and add courses to enrich your learning platform."
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
        <AddUpdateCourse
          courseData={selectedCourse}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
