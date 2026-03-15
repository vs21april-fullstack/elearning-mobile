import { NavLink } from "react-router-dom";
import { useAuth } from "../app/authContext";
import HomeIcon from "../assets/svg/HomeIcon";
import StudentIcon from "../assets/svg/StudentIcon";
import TeacherIcon from "../assets/svg/TeacherIcon";
import CourseIcon from "../assets/svg/CourseIcon";
import LogoutIcon from "../assets/svg/LogoutIcon";
import QueenAxeLogo from "../assets/svg/QueenAxeLogo";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isCollapsed }) {
  const { logout, user } = useAuth();
  const role = user?.role;

  return (
    <div
      className={`glass-dark ${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
    >
      {/* Logo */}
      <div className={styles.logoSection}>
        <div
          className={`${styles.logoCard} ${isCollapsed ? styles.logoCardCollapsed : ""}`}
          title={isCollapsed ? "QueenAxe" : ""}
        >
          <QueenAxeLogo
            width={isCollapsed ? 34 : 148}
            variant={isCollapsed ? "mark" : "full"}
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
