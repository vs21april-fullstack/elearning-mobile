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
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 991 : false,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 991px)");
    const handleViewportChange = (event) => {
      setIsMobile(event.matches);
      if (!event.matches) {
        setIsSidebarOpen(false);
      }
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleViewportChange);

    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen((prev) => !prev);
      return;
    }
    setIsCollapsed((prev) => !prev);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={styles.layout}>
      <Sidebar
        isCollapsed={isCollapsed}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {isMobile && isSidebarOpen && (
        <button
          type="button"
          className={styles.backdrop}
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}

      <div className={styles.main}>
        <Topbar
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
        />
        <div
          className={styles.content}
          onClick={isMobile ? closeSidebar : undefined}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
