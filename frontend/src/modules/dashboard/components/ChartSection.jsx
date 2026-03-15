import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ChartBarIcon from "../../../assets/svg/ChartBarIcon";
import styles from "./DashboardCards.module.css";

const tooltipContentStyle = {
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(47, 125, 87, 0.2)",
  borderRadius: "12px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
};

export default function ChartSection({ data }) {
  return (
    <div className={`glass-card mt-4 animate-slide-in ${styles.chartSection}`}>
      <div className={styles.chartSectionHeader}>
        <div>
          <h5 className={`fw-bold mb-1 ${styles.chartOverviewTitle}`}>
            Overview
          </h5>
          <p className={`text-muted mb-0 ${styles.chartOverviewSub}`}>
            Performance metrics
          </p>
        </div>
        <div className={`glass ${styles.chartBadge}`}>
          <ChartBarIcon size={18} color="#2f7d57" /> Statistics
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis tick={{ fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
          <Tooltip contentStyle={tooltipContentStyle} />
          <Bar
            dataKey="value"
            fill="url(#colorGradient)"
            radius={[12, 12, 0, 0]}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2f7d57" stopOpacity={1} />
              <stop offset="100%" stopColor="#1e5f42" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
