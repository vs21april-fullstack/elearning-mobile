/**
 * Student List Table Columns Configuration
 */

import CourseIcon from "../../assets/svg/CourseIcon";
import EditIcon from "../../assets/svg/EditIcon";
import styles from "../../styles/Columns.module.css";

function CoursePills({ courses }) {
  if (!courses || courses.length === 0)
    return <span style={{ color: "#94a3b8", fontSize: "0.82rem" }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {courses.map((c) => (
        <span
          key={c._id}
          style={{
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: "0.75rem",
            fontWeight: 600,
            background: "rgba(47,125,87,0.1)",
            color: "#2f7d57",
            border: "1px solid rgba(47,125,87,0.2)",
            whiteSpace: "nowrap",
          }}
        >
          {c.title}
        </span>
      ))}
    </div>
  );
}

export const getStudentColumns = (
  handleEdit,
  handleToggleActive,
  handleManageCourses,
) => [
  {
    header: "Student",
    accessor: "name",
    cell: (row) => (
      <div>
        <div className={styles.personName}>{row.name}</div>
        <div className={styles.personMeta}>{row.email}</div>
      </div>
    ),
  },
  {
    header: "Phone",
    accessor: "phone",
  },
  {
    header: "Father Name",
    accessor: "parents",
    cell: (row) => row.parents?.father?.name || "-",
  },
  {
    header: "Father Phone",
    accessor: "parents",
    cell: (row) => row.parents?.father?.phone || "-",
  },
  {
    header: "Status",
    accessor: "isActive",
    cell: (row) => (
      <span
        className={`${styles.statusBadge} ${
          row.isActive ? styles.statusPresent : styles.statusAbsent
        }`}
      >
        {row.isActive ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    header: "Enrolled Courses",
    accessor: "enrolledCourses",
    cell: (row) => <CoursePills courses={row.enrolledCourses || []} />,
  },
  {
    header: "Actions",
    accessor: "actions",
    cell: (row) => (
      <div className={styles.actionRow}>
        <button
          onClick={() => handleEdit(row)}
          className={`${styles.actionButton} ${styles.buttonEdit}`}
        >
          <EditIcon size={16} color="white" /> Edit
        </button>
        <button
          onClick={() => handleManageCourses(row)}
          className={`${styles.actionButton} ${styles.buttonInfo}`}
          title="Manage Courses"
        >
          <CourseIcon size={16} color="white" /> Courses
        </button>
        <button
          onClick={() => handleToggleActive(row)}
          className={styles.toggleButton}
          aria-pressed={row.isActive}
          title={row.isActive ? "Set Inactive" : "Set Active"}
        >
          <span
            className={`${styles.toggleTrack} ${
              row.isActive
                ? styles.toggleTrackActive
                : styles.toggleTrackInactive
            }`}
          >
            <span
              className={`${styles.toggleThumb} ${
                row.isActive ? styles.toggleThumbActive : ""
              }`}
            />
          </span>
          <span className={styles.toggleLabel}>
            {row.isActive ? "Active" : "Inactive"}
          </span>
        </button>
      </div>
    ),
  },
];
