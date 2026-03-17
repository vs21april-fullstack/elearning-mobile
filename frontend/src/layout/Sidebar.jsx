import { NavLink } from "react-router-dom";
import { useAuth } from "../app/authContext";
import HomeIcon from "../assets/svg/HomeIcon";
import StudentIcon from "../assets/svg/StudentIcon";
import TeacherIcon from "../assets/svg/TeacherIcon";
import CourseIcon from "../assets/svg/CourseIcon";
import MeetingIcon from "../assets/svg/MeetingIcon";
import LogoutIcon from "../assets/svg/LogoutIcon";
import QueenAxeLogo from "../assets/svg/QueenAxeLogo";
import { useConfirm } from "../app/confirmContext";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isCollapsed, isMobile, isOpen, onClose }) {
  const { logout, user } = useAuth();
  const confirm = useConfirm();
  const role = user?.role;

  const handleLogoutClick = async () => {
    if (isMobile) {
      onClose?.();
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    const confirmed = await confirm({
      title: "Confirm Logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      confirmVariant: "danger",
    });
    if (!confirmed) return;
    await logout();
  };

  return (
    <div
      className={`glass-dark ${styles.sidebar} ${isCollapsed && !isMobile ? styles.collapsed : ""} ${isMobile ? (isOpen ? styles.mobileOpen : styles.mobileHidden) : ""}`}
    >
      {/* Logo */}
      <div className={styles.logoSection}>
        <div
          className={`${styles.logoCard} ${isCollapsed ? styles.logoCardCollapsed : ""}`}
          title={isCollapsed ? "QueenAxe" : ""}
        >
          <QueenAxeLogo
            width={isMobile ? 148 : isCollapsed ? 34 : 148}
            variant={isMobile ? "full" : isCollapsed ? "mark" : "full"}
            className={styles.logoMark}
          />
        </div>
      </div>

      {/* Menu */}
      <div className={styles.menu}>
        <SidebarItem
          to="/dashboard"
          icon={<HomeIcon size={20} />}
          label="Dashboard"
          isCollapsed={isCollapsed && !isMobile}
          onNavigate={onClose}
        />
        {role === "admin" && (
          <>
            <SidebarItem
              to="/students"
              icon={<StudentIcon size={20} />}
              label="Students"
              isCollapsed={isCollapsed && !isMobile}
              onNavigate={onClose}
            />
            <SidebarItem
              to="/teachers"
              icon={<TeacherIcon size={20} />}
              label="Teachers"
              isCollapsed={isCollapsed && !isMobile}
              onNavigate={onClose}
            />
            <SidebarItem
              to="/courses"
              icon={<CourseIcon size={20} />}
              label="Courses"
              isCollapsed={isCollapsed && !isMobile}
              onNavigate={onClose}
            />
            <SidebarItem
              to="/attendance"
              icon={<StudentIcon size={20} />}
              label="Attendance"
              isCollapsed={isCollapsed && !isMobile}
              onNavigate={onClose}
            />
          </>
        )}
        {(role === "teacher" || role === "admin") && (
          <SidebarItem
            to="/meetings"
            icon={<MeetingIcon size={20} />}
            label="Meetings"
            isCollapsed={isCollapsed && !isMobile}
            onNavigate={onClose}
          />
        )}
        {/* Logout */}
        <button
          onClick={handleLogoutClick}
          className={`${styles.logoutButton} ${isCollapsed && !isMobile ? styles.menuItemCollapsed : ""}`}
          title={isCollapsed && !isMobile ? "Logout" : ""}
        >
          <LogoutIcon size={20} color="#fca5a5" />
          {(!isCollapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

function SidebarItem({ to, icon, label, isCollapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      title={isCollapsed ? label : ""}
      onClick={onNavigate}
      className={({ isActive }) =>
        `${styles.menuItem} ${isCollapsed ? styles.menuItemCollapsed : ""} ${isActive ? styles.menuItemActive : ""}`
      }
    >
      <span className={styles.menuIcon}>{icon}</span>
      {!isCollapsed && <span>{label}</span>}
    </NavLink>
  );
}
