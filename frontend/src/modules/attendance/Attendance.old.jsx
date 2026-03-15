import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getClassAttendance,
  getAttendanceReport,
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  getUserLoginAttendance,
  recordLogout,
} from "./attendance.api";
import {
  getAttendanceColumns,
  getLoginAttendanceColumns,
} from "./attendance.columns";
import DataTable from "../../components/DataTable";
import Spinner from "../../components/Spinner";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import AttendanceMarkForm from "./components/AttendanceMarkForm";
import { Input } from "../../components/FormField";
import styles from "./Attendance.module.css";
import toast from "react-hot-toast";

export default function Attendance() {
  const [activeTab, setActiveTab] = useState("login"); // 'login' or 'manual'
  const [showModal, setShowModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [classFilter, setClassFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loginStartDate, setLoginStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
  );
  const [loginEndDate, setLoginEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const queryClient = useQueryClient();

  // Manual attendance query
  const { data: manualData, isLoading: manualLoading } = useQuery({
    queryKey: ["attendance", classFilter, dateFilter],
    queryFn: () =>
      classFilter && dateFilter
        ? getClassAttendance(classFilter, dateFilter)
        : Promise.resolve([]),
    keepPreviousData: true,
  });

  // Login attendance query
  const { data: loginData, isLoading: loginLoading } = useQuery({
    queryKey: ["loginAttendance", loginStartDate, loginEndDate],
    queryFn: () => getUserLoginAttendance(loginStartDate, loginEndDate),
    enabled: activeTab === "login",
  });

  const attendanceRecords = useMemo(
    () => (Array.isArray(manualData) ? manualData : []),
    [manualData],
  );

  const loginRecords = useMemo(
    () => (Array.isArray(loginData) ? loginData : []),
    [loginData],
  );

  const markMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      toast.success("Attendance marked successfully!");
      queryClient.invalidateQueries(["attendance"]);
      setShowModal(false);
      setSelectedAttendance(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to mark attendance");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: bulkMarkAttendance,
    onSuccess: () => {
      toast.success("Bulk attendance marked successfully!");
      queryClient.invalidateQueries(["attendance"]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to mark bulk attendance",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAttendance(id, data),
    onSuccess: () => {
      toast.success("Attendance updated successfully!");
      queryClient.invalidateQueries(["attendance"]);
      setShowModal(false);
      setSelectedAttendance(null);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update attendance",
      );
    },
  });

  const logoutMutation = useMutation({
    mutationFn: recordLogout,
    onSuccess: () => {
      toast.success("Logout recorded successfully!");
      queryClient.invalidateQueries(["loginAttendance"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to record logout");
    },
  });

  const handleAdd = useCallback(() => {
    if (!classFilter) {
      toast.error("Please select a class first");
      return;
    }
    setSelectedAttendance(null);
    setShowModal(true);
  }, [classFilter]);

  const handleEdit = useCallback((attendance) => {
    setSelectedAttendance(attendance);
    setShowModal(true);
  }, []);

  const handleSave = useCallback(
    async (formData) => {
      try {
        if (selectedAttendance?._id) {
          await updateMutation.mutateAsync({
            id: selectedAttendance._id,
            data: formData,
          });
        } else {
          await markMutation.mutateAsync({
            ...formData,
            classId: classFilter,
            date: dateFilter,
          });
        }
      } catch (error) {
        // Error is handled in mutation
      }
    },
    [selectedAttendance, classFilter, dateFilter, markMutation, updateMutation],
  );

  const handleLogout = useCallback(() => {
    if (window.confirm("Are you sure you want to record logout?")) {
      logoutMutation.mutate();
    }
  }, [logoutMutation]);

  const manualColumns = getAttendanceColumns(handleEdit);
  const loginColumns = getLoginAttendanceColumns();

  return (
    <div className="container-fluid p-4">
      <div className="mb-4">
        <h2 className="mb-3">Attendance Management</h2>

        {/* Tabs */}
        <div className={`glass-card ${styles.tabsHeader}`}>
          <button
            onClick={() => setActiveTab("login")}
            className={`${styles.tabButton} ${activeTab === "login" ? styles.tabButtonActive : styles.tabButtonInactive}`}
          >
            Login/Logout Records
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`${styles.tabButton} ${activeTab === "manual" ? styles.tabButtonActive : styles.tabButtonInactive}`}
          >
            Manual Attendance
          </button>
        </div>

        {/* Login/Logout Tab */}
        {activeTab === "login" && (
          <div className="row mb-4">
            <div className="col-md-4">
              <Input
                label="Start Date"
                type="date"
                id="loginStartDate"
                value={loginStartDate}
                onChange={(e) => setLoginStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <Input
                label="End Date"
                type="date"
                id="loginEndDate"
                value={loginEndDate}
                onChange={(e) => setLoginEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <Button onClick={handleLogout} className={styles.fullWidthButton}>
                Record Logout
              </Button>
            </div>
          </div>
        )}

        {/* Manual Attendance Tab */}
        {activeTab === "manual" && (
          <div className="row mb-4">
            <div className="col-md-4">
              <Input
                label="Select Class"
                type="text"
                id="classFilter"
                placeholder="Enter class ID"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <Input
                label="Select Date"
                type="date"
                id="dateFilter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <Button onClick={handleAdd} className={styles.fullWidthButton}>
                Mark Attendance
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === "login" ? (
        loginLoading ? (
          <div className={styles.loadingContainer}>
            <Spinner />
          </div>
        ) : loginRecords.length > 0 ? (
          <div className={styles.contentCard}>
            <DataTable columns={loginColumns} data={loginRecords} />
          </div>
        ) : (
          <div className={styles.emptyCard}>
            <EmptyState
              type="attendance"
              title="No Login Records"
              message="No login records found for the selected period. Records will appear here once users log in."
            />
          </div>
        )
      ) : manualLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner />
        </div>
      ) : attendanceRecords.length > 0 ? (
        <div className={styles.contentCard}>
          <DataTable columns={manualColumns} data={attendanceRecords} />
        </div>
      ) : (
        <div className={styles.emptyCard}>
          <EmptyState
            type="attendance"
            title="No Attendance Records"
            message="No attendance records found. Please select a class and date to view or mark attendance."
          />
        </div>
      )}

      {showModal && (
        <AttendanceMarkForm
          initialData={selectedAttendance}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setSelectedAttendance(null);
          }}
          isLoading={markMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
