/**
 * Meeting List Table Columns Configuration
 */

import EditIcon from "../../assets/svg/EditIcon";
import DeleteIcon from "../../assets/svg/DeleteIcon";
import styles from "../../styles/Columns.module.css";

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "scheduled":
      return styles.statusScheduled || "bg-primary";
    case "ongoing":
      return styles.statusOngoing || "bg-success";
    case "completed":
      return styles.statusCompleted || "bg-secondary";
    case "cancelled":
      return styles.statusCancelled || "bg-danger";
    default:
      return "bg-secondary";
  }
};

export const getMeetingColumns = (
  handleEdit,
  handleDelete,
  handleCopyLink,
  handleJoin,
) => [
  {
    header: "Meeting",
    accessor: "title",
    cell: (row) => (
      <div>
        <div className={styles.personName}>{row.title}</div>
        <div className={styles.personMeta}>{row.course?.title || "N/A"}</div>
      </div>
    ),
  },
  {
    header: "Teacher",
    accessor: "teacher",
    cell: (row) => row.teacher?.name || "N/A",
  },
  {
    header: "Date",
    accessor: "date",
    cell: (row) => formatDate(row.date),
  },
  {
    header: "Time",
    accessor: "startTime",
    cell: (row) => `${row.startTime} - ${row.endTime}`,
  },
  {
    header: "Status",
    accessor: "status",
    cell: (row) => (
      <span className={`badge ${getStatusBadgeClass(row.status)}`}>
        {row.status}
      </span>
    ),
  },
  {
    header: "Actions",
    accessor: "actions",
    cell: (row) => (
      <div className={styles.actionRow}>
        {handleJoin && (
          <button
            onClick={() => handleJoin(row)}
            className={`${styles.actionButton} ${styles.buttonSuccess}`}
            title="Join Meeting"
          >
            📞 Join
          </button>
        )}
        {row.meetingLink && (
          <button
            onClick={() => handleCopyLink(row)}
            className={`${styles.actionButton} ${styles.buttonInfo}`}
            title="Copy Meeting Link"
          >
            📋 Link
          </button>
        )}
        <button
          onClick={() => handleEdit(row)}
          className={`${styles.actionButton} ${styles.buttonEdit}`}
        >
          <EditIcon size={16} color="white" /> Edit
        </button>
        <button
          onClick={() => handleDelete(row)}
          className={`${styles.actionButton} ${styles.buttonDelete}`}
        >
          <DeleteIcon size={16} color="white" /> Delete
        </button>
      </div>
    ),
  },
];
