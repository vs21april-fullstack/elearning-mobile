import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../app/authContext";
import HomeIcon from "../assets/svg/HomeIcon";
import StudentIcon from "../assets/svg/StudentIcon";
import TeacherIcon from "../assets/svg/TeacherIcon";
import CourseIcon from "../assets/svg/CourseIcon";
import LogoutIcon from "../assets/svg/LogoutIcon";
import GraduationCapIcon from "../assets/svg/GraduationCapIcon";
import HamburgerIcon from "../assets/svg/HamburgerIcon";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const role = user?.role;
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`glass-dark ${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
    >
      {/* Logo with Hamburger */}
      <div className={styles.logoSection}>
        {/* Logo */}
        <div
          className={`${styles.logoCard} ${isCollapsed ? styles.logoCardCollapsed : ""}`}
          title={isCollapsed ? "Coaching ERP" : ""}
        >
          <GraduationCapIcon size={26} color="white" />
          {!isCollapsed && (
            <span className={styles.logoText}>Coaching ERP</span>
          )}
        </div>

        {/* Hamburger Button - Positioned at top right */}
        <button
          onClick={toggleSidebar}
          className={`${styles.hamburgerButton} ${isCollapsed ? styles.hamburgerButtonCollapsed : ""}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <HamburgerIcon size={18} color="white" />
        </button>
      </div>

      {/* Menu */}
      <div className={styles.menu}>
        <SidebarItem
          to="/dashboard"
          icon={<HomeIcon size={20} />}
          label="Dashboard"
          isCollapsed={isCollapsed}
        />
        {role === "admin" && (
          <>
            <SidebarItem
              to="/students"
              icon={<StudentIcon size={20} />}
              label="Students"
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              to="/teachers"
              icon={<TeacherIcon size={20} />}
              label="Teachers"
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              to="/courses"
              icon={<CourseIcon size={20} />}
              label="Courses"
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              to="/attendance"
              icon={<StudentIcon size={20} />}
              label="Attendance"
              isCollapsed={isCollapsed}
            />
          </>
        )}
        {role === "teacher" && (
          <SidebarItem
            to="/meetings"
            icon={<span>📅</span>}
            label="Meetings"
            isCollapsed={isCollapsed}
          />
        )}
        {/* Logout */}
        <button
          onClick={logout}
          className={`${styles.logoutButton} ${isCollapsed ? styles.menuItemCollapsed : ""}`}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogoutIcon size={20} color="#fca5a5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

function SidebarItem({ to, icon, label, isCollapsed }) {
  return (
    <NavLink
      to={to}
      title={isCollapsed ? label : ""}
      className={({ isActive }) =>
        `${styles.menuItem} ${isCollapsed ? styles.menuItemCollapsed : ""} ${isActive ? styles.menuItemActive : ""}`
      }
    >
      <span className={styles.menuIcon}>{icon}</span>
      {!isCollapsed && <span>{label}</span>}
    </NavLink>
  );
}
