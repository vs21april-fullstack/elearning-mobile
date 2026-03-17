import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMeetings } from "../meetings/meetings.api";
import { fetchTeachers } from "../teachers/teachers.api";
import { getMeetingLogColumns } from "./attendance.columns";
import DataTable from "../../components/DataTable";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import MeetingIcon from "../../assets/svg/MeetingIcon";
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

  // Fetch meeting logs with active filters - only completed meetings
  const { data: meetingsData, isLoading } = useQuery({
    queryKey: ["meeting-logs", selectedTeacherId, selectedCourseId],
    queryFn: () =>
      fetchMeetings({
        page: 1,
        limit: 200,
        status: "completed",
        ...(selectedTeacherId && { teacherId: selectedTeacherId }),
        ...(selectedCourseId && { courseId: selectedCourseId }),
      }),
    keepPreviousData: true,
  });

  const teachers = useMemo(() => teachersData?.data ?? [], [teachersData]);
  const selectedTeacher = useMemo(
    () =>
      teachers.find(
        (teacher) =>
          String(teacher?._id ?? teacher?.id ?? "") === selectedTeacherId,
      ) || null,
    [teachers, selectedTeacherId],
  );

  const courses = useMemo(() => {
    if (!selectedTeacherId || !selectedTeacher) return [];
    return selectedTeacher.assignedCourses || [];
  }, [selectedTeacherId, selectedTeacher]);

  const meetings = useMemo(() => {
    const rows = meetingsData?.data ?? [];
    return rows.filter((meeting) => {
      if (meeting?.status !== "completed") return false;

      if (selectedTeacherId) {
        const meetingTeacherId = meeting?.teacher?._id || meeting?.teacher;
        if (String(meetingTeacherId || "") !== selectedTeacherId) return false;
      }

      if (selectedCourseId) {
        const meetingCourseId = meeting?.course?._id || meeting?.course;
        if (String(meetingCourseId || "") !== selectedCourseId) return false;
      }

      return true;
    });
  }, [meetingsData, selectedTeacherId, selectedCourseId]);

  const columns = getMeetingLogColumns();

  const hasFilters = selectedTeacherId || selectedCourseId;

  return (
    <div className={`container-fluid py-4 ${styles.container}`}>
      {/* Page Header */}
      <div className={`animate-fade-in ${styles.heroBanner}`}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>
              <span className="d-inline-flex align-items-center gap-2">
                <MeetingIcon size={22} color="white" />
                Teacher Meeting Logs
              </span>
            </h2>
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
      </div>

      {/* Filter Bar */}
      <div className={`glass-card ${styles.filterBar}`}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Teacher</label>
          <select
            className={styles.filterSelect}
            value={selectedTeacherId}
            onChange={(e) => {
              setSelectedTeacherId(e.target.value);
              setSelectedCourseId("");
            }}
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
            disabled={!selectedTeacherId}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">
              {selectedTeacherId ? "All Coursesss" : "Select a teacher first"}
            </option>
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
