import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/authContext";
import {
  fetchMeetingsForStudent,
  fetchMeetingsForTeacher,
} from "./meetings.api";
import Spinner from "../../components/Spinner";
import Button from "../../components/Button";
import Pagination from "../../components/Pagination";
import styles from "./MeetingsDashboard.module.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MEETINGS_PER_PAGE = 5;

function getDateFilterValue(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return days;
}

function parseMeetingDateTime(
  dateValue,
  timeValue,
  fallbackHours = 0,
  fallbackMinutes = 0,
) {
  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date(0);
  }

  const [hoursText, minutesText] = (timeValue || "").split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  parsedDate.setHours(
    Number.isNaN(hours) ? fallbackHours : hours,
    Number.isNaN(minutes) ? fallbackMinutes : minutes,
    0,
    0,
  );

  return parsedDate;
}

function parseTimeToMinutes(timeValue, fallbackHours = 0, fallbackMinutes = 0) {
  if (!timeValue) {
    return fallbackHours * 60 + fallbackMinutes;
  }

  const normalized = String(timeValue).trim().toUpperCase();
  const match12Hour = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

  if (match12Hour) {
    let hours = Number.parseInt(match12Hour[1], 10);
    const minutes = Number.parseInt(match12Hour[2], 10);
    const period = match12Hour[3];

    if (period === "AM" && hours === 12) {
      hours = 0;
    }

    if (period === "PM" && hours !== 12) {
      hours += 12;
    }

    return hours * 60 + minutes;
  }

  const [hoursText, minutesText] = normalized.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return fallbackHours * 60 + fallbackMinutes;
  }

  return hours * 60 + minutes;
}

function getMeetingWindow(meeting) {
  const startDateTime = parseMeetingDateTime(
    meeting.date,
    meeting.startTime,
    0,
    0,
  );
  const endDateTime = parseMeetingDateTime(
    meeting.date,
    meeting.endTime,
    23,
    59,
  );

  const startMinutes = parseTimeToMinutes(meeting.startTime, 0, 0);
  const endMinutes = parseTimeToMinutes(meeting.endTime, 23, 59);

  if (endMinutes <= startMinutes) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  return { startDateTime, endDateTime };
}

export default function MeetingsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === "teacher";
  const [now, setNow] = useState(() => new Date());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: [isTeacher ? "teacherMeetings" : "studentMeetings", user?.id],
    queryFn: () =>
      isTeacher
        ? fetchMeetingsForTeacher(user.id)
        : fetchMeetingsForStudent(user.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const courseOptions = useMemo(() => {
    const courseMap = new Map();

    meetings.forEach((meeting) => {
      if (meeting.course?._id && !courseMap.has(meeting.course._id)) {
        courseMap.set(
          meeting.course._id,
          meeting.course.title || "Untitled Course",
        );
      }
    });

    return Array.from(courseMap.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const matchesCourse =
        selectedCourseId === "all" || meeting.course?._id === selectedCourseId;
      const matchesDate =
        !selectedDate || getDateFilterValue(meeting.date) === selectedDate;

      return matchesCourse && matchesDate;
    });
  }, [meetings, selectedCourseId, selectedDate]);

  const filteredMeetingsWithWindow = useMemo(() => {
    return filteredMeetings.map((meeting) => ({
      ...meeting,
      ...getMeetingWindow(meeting),
    }));
  }, [filteredMeetings]);

  const upcomingMeetings = useMemo(() => {
    return filteredMeetingsWithWindow
      .filter((meeting) => meeting.endDateTime >= now)
      .sort((a, b) => {
        const dateDiff = a.startDateTime - b.startDateTime;

        if (dateDiff !== 0) {
          return dateDiff;
        }

        return (a.startTime || "").localeCompare(b.startTime || "");
      });
  }, [filteredMeetingsWithWindow, now]);

  const pastMeetings = useMemo(() => {
    return filteredMeetingsWithWindow
      .filter((meeting) => meeting.endDateTime < now)
      .sort((a, b) => b.startDateTime - a.startDateTime);
  }, [filteredMeetingsWithWindow, now]);

  const filteredUpcomingMeetings = upcomingMeetings;

  const filteredPastMeetings = pastMeetings;

  const upcomingTotalPages = Math.max(
    1,
    Math.ceil(filteredUpcomingMeetings.length / MEETINGS_PER_PAGE),
  );
  const pastTotalPages = Math.max(
    1,
    Math.ceil(filteredPastMeetings.length / MEETINGS_PER_PAGE),
  );

  const paginatedUpcomingMeetings = useMemo(() => {
    const startIndex = (upcomingPage - 1) * MEETINGS_PER_PAGE;

    return filteredUpcomingMeetings.slice(
      startIndex,
      startIndex + MEETINGS_PER_PAGE,
    );
  }, [filteredUpcomingMeetings, upcomingPage]);

  const paginatedPastMeetings = useMemo(() => {
    const startIndex = (pastPage - 1) * MEETINGS_PER_PAGE;

    return filteredPastMeetings.slice(
      startIndex,
      startIndex + MEETINGS_PER_PAGE,
    );
  }, [filteredPastMeetings, pastPage]);

  const activeMeetings =
    activeTab === "upcoming"
      ? paginatedUpcomingMeetings
      : paginatedPastMeetings;
  const activeMeetingsCount =
    activeTab === "upcoming"
      ? filteredUpcomingMeetings.length
      : filteredPastMeetings.length;
  const currentPage = activeTab === "upcoming" ? upcomingPage : pastPage;
  const totalPages =
    activeTab === "upcoming" ? upcomingTotalPages : pastTotalPages;
  const totalItems =
    activeTab === "upcoming"
      ? filteredUpcomingMeetings.length
      : filteredPastMeetings.length;

  useEffect(() => {
    setUpcomingPage(1);
    setPastPage(1);
  }, [selectedCourseId, selectedDate]);

  useEffect(() => {
    if (upcomingPage > upcomingTotalPages) {
      setUpcomingPage(upcomingTotalPages);
    }
  }, [upcomingPage, upcomingTotalPages]);

  useEffect(() => {
    if (pastPage > pastTotalPages) {
      setPastPage(pastTotalPages);
    }
  }, [pastPage, pastTotalPages]);

  const calendarDays = useMemo(
    () => getCalendarDays(calYear, calMonth),
    [calYear, calMonth],
  );

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((year) => year - 1);
    } else {
      setCalMonth((month) => month - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((year) => year + 1);
    } else {
      setCalMonth((month) => month + 1);
    }
  };

  if (meetingsLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.greeting}>
        <h2 className={styles.greetingTitle}>
          Welcome Back{user?.name ? `, ${user.name}` : ""}!
        </h2>
        <p className={styles.greetingSubtitle}>
          {isTeacher
            ? "Here are your meetings. Start or join anytime."
            : "Here are your meetings. Join live sessions below."}
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.meetingsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeadingGroup}>
              <h4 className={styles.sectionTitle}>
                <span>📅 Meetings</span>
                <span className={styles.badge}>{activeMeetingsCount}</span>
              </h4>

              <div className={styles.tabRow}>
                <button
                  type="button"
                  onClick={() => setActiveTab("upcoming")}
                  className={`${styles.tabButton} ${activeTab === "upcoming" ? styles.tabButtonActive : ""}`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("past")}
                  className={`${styles.tabButton} ${activeTab === "past" ? styles.tabButtonActive : ""}`}
                >
                  Past
                </button>
              </div>
            </div>

            <div className={styles.filtersRow}>
              {courseOptions.length > 0 && (
                <div className={styles.filterGroup}>
                  <label
                    htmlFor="dashboard-course-filter"
                    className={styles.filterLabel}
                  >
                    Course
                  </label>
                  <select
                    id="dashboard-course-filter"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Courses</option>
                    {courseOptions.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.filterGroup}>
                <label
                  htmlFor="dashboard-date-filter"
                  className={styles.filterLabel}
                >
                  Date
                </label>
                <div className={styles.dateFilterRow}>
                  <input
                    id="dashboard-date-filter"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={styles.filterInput}
                  />
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate("")}
                      className={styles.clearFilterButton}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {activeMeetings.length > 0 ? (
            <div className={styles.meetingsList}>
              {activeMeetings.map((meeting) => {
                const meetingDate = new Date(meeting.date);
                const canJoinNow =
                  now >= meeting.startDateTime && now <= meeting.endDateTime;
                const isToday =
                  meetingDate.getDate() === now.getDate() &&
                  meetingDate.getMonth() === now.getMonth() &&
                  meetingDate.getFullYear() === now.getFullYear();

                return (
                  <div key={meeting._id} className={styles.meetingCard}>
                    <div className={styles.meetingInfo}>
                      <h5 className={styles.meetingTitle}>{meeting.title}</h5>
                      <span className={styles.courseLabel}>
                        {meeting.course?.title || "N/A"}
                      </span>
                      {meeting.teacher && (
                        <span className={styles.teacherLabel}>
                          Teacher:{" "}
                          {meeting.teacher.name || meeting.teacher.email}
                        </span>
                      )}
                      <span
                        className={`${styles.timeLabel} ${isToday ? styles.todayLabel : ""}`}
                      >
                        {isToday
                          ? "🔔 Today"
                          : meetingDate.toLocaleDateString()}{" "}
                        at {meeting.startTime} - {meeting.endTime}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      onClick={() =>
                        navigate(`/meetings/join/${meeting._id}`, {
                          state: { autoJoin: true },
                        })
                      }
                      className={styles.joinBtn}
                      disabled={activeTab === "past" || !canJoinNow}
                    >
                      {activeTab === "past"
                        ? "Completed"
                        : canJoinNow
                          ? "📞 Join"
                          : "Starts Soon"}
                    </Button>
                  </div>
                );
              })}

              <div className={styles.paginationWrapper}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={MEETINGS_PER_PAGE}
                  onPageChange={
                    activeTab === "upcoming" ? setUpcomingPage : setPastPage
                  }
                />
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>
                {activeTab === "upcoming"
                  ? "No upcoming meetings found for the selected filters."
                  : "No past meetings found for the selected filters."}
              </p>
            </div>
          )}
        </div>

        <div className={styles.calendarSection}>
          <div className={styles.calendarHeader}>
            <button onClick={prevMonth} className={styles.calNavBtn}>
              ‹
            </button>
            <span className={styles.calMonthLabel}>
              {MONTHS[calMonth]} {calYear}
            </span>
            <button onClick={nextMonth} className={styles.calNavBtn}>
              ›
            </button>
          </div>

          <div className={styles.calendarGrid}>
            {WEEKDAYS.map((day) => (
              <div key={day} className={styles.calWeekday}>
                {day}
              </div>
            ))}

            {calendarDays.map((day, index) => {
              const isToday =
                day === now.getDate() &&
                calMonth === now.getMonth() &&
                calYear === now.getFullYear();

              return (
                <div
                  key={index}
                  className={`${styles.calDay} ${!day ? styles.calDayEmpty : ""} ${isToday ? styles.calDayToday : ""}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
