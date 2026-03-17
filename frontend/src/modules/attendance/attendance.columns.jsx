/**
 * Attendance List Table Columns Configuration
 */

import EditIcon from "../../assets/svg/EditIcon";
import styles from "../../styles/Columns.module.css";

export const getAttendanceColumns = (handleEdit) => [
  {
    header: "Student",
    accessor: (row) => row.student?.name || "N/A",
  },
  {
    header: "Date",
    accessor: (row) => new Date(row.date).toLocaleDateString(),
  },
  {
    header: "Status",
    accessor: (row) => (
      <span
        className={`${styles.statusBadge} ${
          row.status === "present"
            ? styles.statusPresent
            : row.status === "absent"
              ? styles.statusAbsent
              : styles.statusLate
        }`}
      >
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </span>
    ),
  },
  {
    header: "Remarks",
    accessor: (row) => row.remarks || "-",
  },
  {
    header: "Marked By",
    accessor: (row) => row.markedBy?.name || "N/A",
  },
  {
    header: "Actions",
    accessor: (row) => (
      <button
        onClick={() => handleEdit(row)}
        className={`${styles.actionButton} ${styles.buttonPrimary}`}
      >
        <EditIcon width={16} height={16} color="white" />
        Edit
      </button>
    ),
  },
];

export const getLoginAttendanceColumns = () => [
  {
    header: "User",
    accessor: (row) => row.user?.name || "N/A",
  },
  {
    header: "Role",
    accessor: (row) => (
      <span
        className={`${styles.statusBadge} ${
          row.user?.role === "teacher"
            ? styles.roleTeacher
            : row.user?.role === "student"
              ? styles.roleStudent
              : styles.roleAdmin
        }`}
      >
        {row.user?.role?.charAt(0).toUpperCase() + row.user?.role?.slice(1) ||
          "N/A"}
      </span>
    ),
  },
  {
    header: "Date",
    accessor: (row) => new Date(row.date).toLocaleDateString(),
  },
  {
    header: "Check-In Time",
    accessor: (row) =>
      row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString() : "-",
  },
  {
    header: "Check-Out Time",
    accessor: (row) =>
      row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString() : "-",
  },
  {
    header: "Duration",
    accessor: (row) => {
      if (row.checkInTime && row.checkOutTime) {
        const duration = Math.floor(
          (new Date(row.checkOutTime) - new Date(row.checkInTime)) / 60000,
        );
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return `${hours}h ${minutes}m`;
      }
      return row.checkInTime ? "In Progress" : "-";
    },
  },
];

// ─── Teacher Meeting Log Columns ───────────────────────────────────────────

const formatMeetingDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const statusBadgeClass = (status) => {
  switch (status) {
    case "scheduled":
      return styles.statusScheduled;
    case "ongoing":
      return styles.statusOngoing;
    case "completed":
      return styles.statusCompleted;
    case "cancelled":
      return styles.statusCancelled;
    default:
      return styles.statusBadge;
  }
};

export const getMeetingLogColumns = () => [
  {
    header: "Meeting",
    accessor: "title",
    cell: (row) => (
      <div>
        <div style={{ fontWeight: 600, color: "#1e293b" }}>
          {row.title || "Untitled"}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>
          {row.course?.title || "—"}
        </div>
      </div>
    ),
  },
  {
    header: "Teacher",
    accessor: "teacher",
    cell: (row) => row.teacher?.name || "N/A",
  },
  {
    header: "Course",
    accessor: "course",
    cell: (row) => row.course?.title || "N/A",
  },
  {
    header: "Date",
    accessor: "date",
    cell: (row) => (row.date ? formatMeetingDate(row.date) : "—"),
  },
  {
    header: "Time",
    accessor: "startTime",
    cell: (row) =>
      row.startTime && row.endTime
        ? `${row.startTime} – ${row.endTime}`
        : row.startTime || "—",
  },
  {
    header: "Status",
    accessor: "status",
    cell: (row) => (
      <span className={`${styles.statusBadge} ${statusBadgeClass(row.status)}`}>
        {row.status
          ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
          : "—"}
      </span>
    ),
  },
  {
    header: "Teacher Presence",
    accessor: "presenceEvents",
    cell: (row) => {
      const teacherId = row.teacher?._id;
      const wasPresent = row.presenceEvents?.some((event) => {
        const eventUserId = event?.user?._id || event?.user;
        return (
          String(eventUserId || "") === String(teacherId || "") &&
          event?.event === "join"
        );
      });
      return (
        <span
          className={`${styles.statusBadge} ${
            wasPresent ? styles.statusPresent : styles.statusAbsent
          }`}
        >
          {wasPresent ? "Present" : "Absent"}
        </span>
      );
    },
  },
];
