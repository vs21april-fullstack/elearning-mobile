/**
 * Teacher List Table Columns Configuration
 */

import EditIcon from "../../assets/svg/EditIcon";
import DeleteIcon from "../../assets/svg/DeleteIcon";
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

export const getTeacherColumns = (handleEdit, handleDelete, handleAssign) => [
  {
    header: "Teacher",
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
    header: "Qualification",
    accessor: "qualification",
    cell: (row) => {
      const qualifications = row.teacherProfile?.qualifications;
      if (!qualifications || qualifications.length === 0) return "N/A";
      const latest = qualifications[0];
      return `${latest.degree} - ${latest.university}`;
    },
  },
  {
    header: "Experience",
    accessor: "experience",
    cell: (row) => {
      const experiences = row.teacherProfile?.experiences;
      if (!experiences || experiences.length === 0) return "N/A";

      // Calculate total years of experience
      const currentYear = new Date().getFullYear();
      let totalYears = 0;

      experiences.forEach((exp) => {
        const endYear = exp.isCurrent
          ? currentYear
          : exp.endYear || currentYear;
        const years = endYear - exp.startYear;
        totalYears += years;
      });

      return totalYears > 0 ? `${totalYears} years` : "N/A";
    },
  },
  {
    header: "Assigned Courses",
    accessor: "assignedCourses",
    cell: (row) => <CoursePills courses={row.assignedCourses || []} />,
  },
  {
    header: "Actions",
    accessor: "actions",
    cell: (row) => (
      <div className={styles.actionRow}>
        <button
          onClick={() => handleAssign(row)}
          className={`${styles.actionButton} ${styles.buttonInfo}`}
        >
          📚 Assign
        </button>
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
