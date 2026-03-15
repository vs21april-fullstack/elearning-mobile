import styles from "./DashboardCards.module.css";

export default function KpiCard({ title, value, icon, color }) {
  const colorClassByHex = {
    "#2f7d57": styles.colorIndigo,
    "#1e5f42": styles.colorPurple,
    "#4cae7b": styles.colorPink,
    "#8fd7a9": styles.colorBlue,
  };

  const colorClass = colorClassByHex[color] || styles.colorIndigo;

  return (
    <div className="col-md-4">
      <div
        className={`glass-card animate-slide-in ${styles.kpiCard} ${colorClass}`}
      >
        {/* Icon Circle */}
        <div className={styles.kpiIcon}>{icon}</div>

        <div>
          <h6 className={`text-muted mb-2 ${styles.kpiTitle}`}>{title}</h6>
          <h2 className={`fw-bold mb-0 ${styles.kpiValue}`}>{value}</h2>
        </div>
        <div className={styles.kpiDecor} />
      </div>
    </div>
  );
}
