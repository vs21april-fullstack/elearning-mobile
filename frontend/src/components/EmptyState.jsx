/**
 * Empty State Component
 * Modern UI component for displaying empty states with SVG illustrations
 */

import styles from "./EmptyState.module.css";

const EmptyState = ({
  title = "No Data Available",
  message = "There are no records to display at the moment.",
  type = "default",
}) => {
  const illustrations = {
    default: (
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-100 ${styles.content}`}
      >
        <circle cx="200" cy="150" r="120" fill="#F3F4F6" />
        <path
          d="M140 180h120M140 140h120M140 100h80"
          stroke="#9CA3AF"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="240" cy="200" r="40" fill="#E5E7EB" />
        <path
          d="M240 185v30M225 200h30"
          stroke="#6B7280"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    ),
    students: (
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-100 ${styles.content}`}
      >
        <circle cx="200" cy="150" r="120" fill="#EEF2FF" />
        <circle cx="200" cy="130" r="30" fill="#C7D2FE" />
        <path
          d="M160 180c0-20 18-36 40-36s40 16 40 36v40h-80v-40z"
          fill="#C7D2FE"
        />
        <path
          d="M180 240l20-20 20 20"
          stroke="#2F7D57"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    teachers: (
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-100 ${styles.content}`}
      >
        <circle cx="200" cy="150" r="120" fill="#FEF3C7" />
        <rect x="150" y="100" width="100" height="120" rx="8" fill="#FDE68A" />
        <circle cx="200" cy="140" r="25" fill="#FCD34D" />
        <path
          d="M175 180h50M175 200h50M175 220h30"
          stroke="#F59E0B"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    ),
    classes: (
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-100 ${styles.content}`}
      >
        <circle cx="200" cy="150" r="120" fill="#DBEAFE" />
        <rect x="130" y="100" width="140" height="100" rx="8" fill="#BFDBFE" />
        <rect x="150" y="120" width="100" height="60" rx="4" fill="#93C5FD" />
        <circle cx="210" cy="220" r="15" fill="#2F7D57" />
        <circle cx="190" cy="220" r="12" fill="#4CAE7B" />
      </svg>
    ),
    courses: (
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-100 ${styles.content}`}
      >
        <circle cx="200" cy="150" r="120" fill="#D1FAE5" />
        <rect x="140" y="90" width="120" height="140" rx="8" fill="#A7F3D0" />
        <path
          d="M160 120h80M160 140h80M160 160h60M160 180h70"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M230 200l-15 15-10-10"
          stroke="#059669"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    attendance: (
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-100 ${styles.content}`}
      >
        <circle cx="200" cy="150" r="120" fill="#E0E7FF" />
        <rect x="140" y="90" width="120" height="140" rx="8" fill="#C7D2FE" />
        <path
          d="M165 120h70M165 140h70"
          stroke="#73b995"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="175" cy="170" r="8" fill="#2F7D57" />
        <circle cx="175" cy="195" r="8" fill="#2F7D57" />
        <path
          d="M195 165l8 8 15-15M195 190l8 8 15-15"
          stroke="#2f7d57"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className="mb-4">{illustrations[type] || illustrations.default}</div>
      <h5 className="fw-bold text-dark mb-2">{title}</h5>
      <p
        className={`text-muted text-center mb-0 ${styles.emptyContentContainer}`}
      >
        {message}
      </p>
    </div>
  );
};

export default EmptyState;
