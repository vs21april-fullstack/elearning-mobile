import { useMemo } from "react";
import WelcomeBanner from "./components/WelcomeBanner";
import KpiCard from "./components/KpiCard";
import ChartSection from "./components/ChartSection";
import StudentIcon from "../../assets/svg/StudentIcon";
import TeacherIcon from "../../assets/svg/TeacherIcon";
import SchoolBuildingIcon from "../../assets/svg/SchoolBuildingIcon";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats } from "./dashboard.api";
import Spinner from "../../components/Spinner";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
  });

  const students = useMemo(() => stats?.students || 0, [stats?.students]);
  const teachers = useMemo(() => stats?.teachers || 0, [stats?.teachers]);
  const courses = useMemo(() => stats?.courses || 0, [stats?.courses]);
  // const revenue = useMemo(() => stats?.revenue || 0, [stats?.revenue]);

  const chartData = useMemo(
    () => [
      { name: "Students", value: students },
      { name: "Teachers", value: teachers },
    ],
    [students, teachers],
  );

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <WelcomeBanner />

      <div className="row g-4">
        <KpiCard
          title="Total Students"
          value={students}
          icon={<StudentIcon size={28} color="white" />}
          color="#2f7d57"
        />
        <KpiCard
          title="Total Teachers"
          value={teachers}
          icon={<TeacherIcon size={28} color="white" />}
          color="#1e5f42"
        />
        <KpiCard
          title="Active Courses"
          value={courses}
          icon={<SchoolBuildingIcon size={28} color="white" />}
          color="#4cae7b"
        />
        {/* <KpiCard
          title="Revenue"
          value={`₹${revenue.toLocaleString()}`}
          icon={<MoneyIcon size={28} color="white" />}
          color="#8fd7a9"
        /> */}
      </div>

      <ChartSection data={chartData} />
    </div>
  );
}
