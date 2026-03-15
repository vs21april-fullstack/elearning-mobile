import { useEffect, useState } from "react";
import styles from "./DashboardCards.module.css";

export default function StatCard({ title, value, icon, color }) {
  const [displayValue, setDisplayValue] = useState(0);
  const colorClassByHex = {
    "#2f7d57": styles.borderIndigo,
    "#1e5f42": styles.borderPurple,
    "#4cae7b": styles.borderPink,
    "#8fd7a9": styles.borderBlue,
  };

  const borderClass = colorClassByHex[color] || styles.borderIndigo;

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const increment = value / (duration / 16);

    const counter = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(counter);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(counter);
  }, [value]);

  return (
    <div className="col-md-4">
      <div
        className={`glass-card animate-fade-in ${styles.statCard} ${borderClass}`}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className={`text-muted mb-1 ${styles.statTitle}`}>{title}</h6>
            <h2 className={`fw-bold mb-0 ${styles.statValue}`}>
              {displayValue}
            </h2>
          </div>
          <div className={styles.statIcon}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
