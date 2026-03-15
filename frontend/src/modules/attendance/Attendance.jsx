import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAttendanceReport,
  recordLogout,
  getUserLoginAttendance,
} from "./attendance.api";
import { getLoginAttendanceColumns } from "./attendance.columns";
import DataTable from "../../components/DataTable";
import Spinner from "../../components/Spinner";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import { Input } from "../../components/FormField";
import styles from "./Attendance.module.css";
import toast from "react-hot-toast";

export default function Attendance() {
  const [activeTab, setActiveTab] = useState("student"); // 'student' or 'teacher'
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const queryClient = useQueryClient();

  // Attendance query with role filter
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ["attendance", startDate, endDate, activeTab],
    queryFn: () => getUserLoginAttendance(startDate, endDate, activeTab),
    keepPreviousData: true,
  });

  const records = useMemo(
    () => (Array.isArray(attendanceData) ? attendanceData : []),
    [attendanceData],
  );

  const logoutMutation = useMutation({
    mutationFn: recordLogout,
    onSuccess: () => {
      toast.success("Logout recorded successfully!");
      queryClient.invalidateQueries(["attendance"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to record logout");
    },
  });

  const handleLogout = useCallback(() => {
    if (window.confirm("Are you sure you want to record logout?")) {
      logoutMutation.mutate();
    }
  }, [logoutMutation]);

  const loginColumns = getLoginAttendanceColumns();

  return (
    <div className="container-fluid p-4">
      <div className="mb-4">
        <h2 className="mb-3">Attendance Management</h2>

        {/* Tabs - Student/Teacher */}
        <div className={`glass-card ${styles.tabsHeader}`}>
          <button
            onClick={() => setActiveTab("student")}
            className={`${styles.tabButton} ${
              activeTab === "student"
                ? styles.tabButtonActive
                : styles.tabButtonInactive
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab("teacher")}
            className={`${styles.tabButton} ${
              activeTab === "teacher"
                ? styles.tabButtonActive
                : styles.tabButtonInactive
            }`}
          >
            Teachers
          </button>
        </div>

        {/* Filters */}
        <div className="row mb-4 mt-4">
          <div className="col-md-4">
            <Input
              label="Start Date"
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <Input
              label="End Date"
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <Button onClick={handleLogout} className={styles.fullWidthButton}>
              Record Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner />
        </div>
      ) : records.length > 0 ? (
        <div className={styles.contentCard}>
          <DataTable columns={loginColumns} data={records} />
        </div>
      ) : (
        <div className={styles.emptyCard}>
          <EmptyState
            type="attendance"
            title={`No ${activeTab === "student" ? "Student" : "Teacher"} Records`}
            message={`No attendance records found for the selected ${activeTab === "student" ? "students" : "teachers"}. Records will appear here once they log in.`}
          />
        </div>
      )}

      {/* Note: Manual attendance entry has been disabled per requirements */}
    </div>
  );
}
