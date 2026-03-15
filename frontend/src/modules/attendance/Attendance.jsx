import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMeetings } from "../meetings/meetings.api";
import { fetchTeachers } from "../teachers/teachers.api";
import { fetchCourses } from "../courses/courses.api";
import { getMeetingLogColumns } from "./attendance.columns";
import DataTable from "../../components/DataTable";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import styles from "./Attendance.module.css";

export default function Attendance() {
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  // Fetch teachers for dropdown
  const { data: teachersData } = useQuery({
    queryKey: ["teachers-all"],
    queryFn: () => fetchTeachers({ page: 1, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch courses for dropdown
  const { data: coursesData } = useQuery({
    queryKey: ["courses-all"],
    queryFn: () => fetchCourses({ page: 1, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch meeting logs with active filters
  const { data: meetingsData, isLoading } = useQuery({
    queryKey: ["meeting-logs", selectedTeacherId, selectedCourseId],
    queryFn: () =>
      fetchMeetings({
        page: 1,
        limit: 200,
        ...(selectedTeacherId && { teacherId: selectedTeacherId }),
        ...(selectedCourseId && { courseId: selectedCourseId }),
      }),
    keepPreviousData: true,
  });

  const teachers = useMemo(() => teachersData?.data ?? [], [teachersData]);
  const courses = useMemo(() => coursesData?.data ?? [], [coursesData]);
  const meetings = useMemo(() => meetingsData?.data ?? [], [meetingsData]);

  const columns = getMeetingLogColumns();

  const hasFilters = selectedTeacherId || selectedCourseId;

  return (
    <div className="container-fluid p-4">
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Teacher Meeting Logs</h2>
          <p className={styles.pageSubtext}>
            View all teacher meeting sessions. Filter by teacher or course.
          </p>
        </div>
        {meetings.length > 0 && (
          <span className={styles.recordsBadge}>
            {meetings.length} Record{meetings.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filter Bar */}
      <div className={`glass-card ${styles.filterBar}`}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Teacher</label>
          <select
            className={styles.filterSelect}
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
          >
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Course</label>
          <select
            className={styles.filterSelect}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            className={styles.clearButton}
            onClick={() => {
              setSelectedTeacherId("");
              setSelectedCourseId("");
            }}
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner />
        </div>
      ) : meetings.length > 0 ? (
        <div className={styles.contentCard}>
          <DataTable columns={columns} data={meetings} />
        </div>
      ) : (
        <div className={styles.emptyCard}>
          <EmptyState
            type="meetings"
            title="No Meeting Logs Found"
            message={
              hasFilters
                ? "No teacher meetings match the selected filters. Try adjusting or clearing the filters."
                : "No teacher meeting sessions have been recorded yet."
            }
          />
        </div>
      )}
    </div>
  );
}
