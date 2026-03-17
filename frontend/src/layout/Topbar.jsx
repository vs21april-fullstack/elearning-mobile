import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../app/authContext";
import { useConfirm } from "../app/confirmContext";
import { fetchProfile } from "../modules/profile/profile.api";
import UserIcon from "../assets/svg/UserIcon";
import LogoutIcon from "../assets/svg/LogoutIcon";
import HamburgerIcon from "../assets/svg/HamburgerIcon";
import styles from "./Topbar.module.css";

export default function Topbar({ isCollapsed, toggleSidebar, isMobile }) {
  const { logout, user } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const profileQueryKey = ["profile", user?.id || user?.token || "anonymous"];

  const handleLogoutClick = async () => {
    const confirmed = await confirm({
      title: "Confirm Logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      confirmVariant: "danger",
    });
    if (!confirmed) return;
    setOpen(false);
    await logout();
  };

  const { data: profile } = useQuery({
    queryKey: profileQueryKey,
    queryFn: fetchProfile,
    enabled: !!user?.token,
    staleTime: 5 * 60 * 1000,
  });

  const roleName =
    user?.role === "teacher"
      ? "Teacher"
      : user?.role === "student"
        ? "Student"
        : "Admin";
  const userName = profile?.name || roleName;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className={`glass ${styles.topbar}`}>
      <div className={styles.leftSection}>
        <button
          onClick={toggleSidebar}
          className={styles.hamburgerButton}
          title={
            isMobile
              ? "Open navigation"
              : isCollapsed
                ? "Expand Sidebar"
                : "Collapse Sidebar"
          }
          aria-label={isMobile ? "Open navigation" : "Toggle sidebar"}
        >
          <HamburgerIcon size={18} color="#2f7d57" />
        </button>
        <h4 className={styles.title}>{roleName} Dashboard</h4>
      </div>

      <div ref={dropdownRef} className={styles.dropdownContainer}>
        <div onClick={() => setOpen(!open)} className={styles.trigger}>
          <span className={styles.userName}>{userName}</span>
          <span className={styles.chevron}>▼</span>
        </div>

        {open && (
          <div className={`animate-fade-in ${styles.menu}`}>
            <div
              onClick={() => {
                navigate("/profile");
                setOpen(false);
              }}
              className={styles.menuItem}
            >
              <UserIcon size={18} color="#2f7d57" /> Profile
            </div>

            <div
              onClick={handleLogoutClick}
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
            >
              <LogoutIcon size={18} color="#ef4444" /> Logout
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
