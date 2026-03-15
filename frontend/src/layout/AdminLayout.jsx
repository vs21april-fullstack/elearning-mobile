import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  return (
    <div className={styles.layout}>
      <Sidebar isCollapsed={isCollapsed} />

      <div className={styles.main}>
        <Topbar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
