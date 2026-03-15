/**
 * Student List Table Columns Configuration
 */

import Avatar from "../../components/Avatar";
import EditIcon from "../../assets/svg/EditIcon";
import DeleteIcon from "../../assets/svg/DeleteIcon";
import styles from "../../styles/Columns.module.css";

export const getStudentColumns = (
  handleEdit,
  handleDelete,
  handleManageCourses,
) => [
  {
    header: "Student",
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
          📚 Courses
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
