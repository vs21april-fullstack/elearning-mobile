/**
 * Teacher List Table Columns Configuration
 */

import Avatar from "../../components/Avatar";
import EditIcon from "../../assets/svg/EditIcon";
import DeleteIcon from "../../assets/svg/DeleteIcon";
import styles from "../../styles/Columns.module.css";

export const getTeacherColumns = (handleEdit, handleDelete, handleAssign) => [
  {
    header: "Teacher",
    accessor: "name",
    cell: (row) => (
      <div className={styles.personCell}>
        <Avatar name={row.name} image={row.profileImage} size={40} />
        <div>
          <div className={styles.personName}>{row.name}</div>
          <div className={styles.personMeta}>{row.email}</div>
        </div>
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
