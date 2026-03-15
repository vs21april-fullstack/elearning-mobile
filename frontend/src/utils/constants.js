/**
 * API Constants
 * Centralized API endpoint definitions
 */

const API_BASE = ''

export const API_ENDPOINTS = {
    // Auth
    LOGIN: `${API_BASE}/auth/login`,
    LOGOUT: `${API_BASE}/auth/logout`,
    REFRESH_TOKEN: `${API_BASE}/auth/refresh`,

    // Users
    USERS: `${API_BASE}/users`,
    STUDENTS: `${API_BASE}/users/students`,
    STUDENT: (id) => `${API_BASE}/users/student/${id}`,
    TEACHERS: `${API_BASE}/users/teachers`,
    TEACHER: (id) => `${API_BASE}/users/teacher/${id}`,

    // Courses
    COURSES: `${API_BASE}/courses`,
    COURSE: (id) => `${API_BASE}/courses/${id}`,
    COURSE_TEACHER: (teacherId) => `${API_BASE}/courses/teacher/${teacherId}`,
    ASSIGN_TEACHER_COURSE: `${API_BASE}/courses/assign-teacher`,

    // Enrollment
    ENROLL_COURSE: `${API_BASE}/courses/enroll`,
    UNENROLL_COURSE: (userId, courseId) => `${API_BASE}/courses/unenroll/${userId}/${courseId}`,
    STUDENT_COURSES: (userId) => `${API_BASE}/courses/student/${userId}`,

    // Meetings
    MEETINGS: `${API_BASE}/meetings`,
    MEETING: (id) => `${API_BASE}/meetings/${id}`,
    MEETING_TEACHER: (teacherId) => `${API_BASE}/meetings/teacher/${teacherId}`,
    MEETING_UPCOMING: `${API_BASE}/meetings/upcoming`,
    MEETING_CANCEL: (id) => `${API_BASE}/meetings/${id}/cancel`,
    MEETING_GENERATE_LINK: (id) => `${API_BASE}/meetings/${id}/generate-link`,
    MEETING_JOIN_CONFIG: (id) => `${API_BASE}/meetings/${id}/join-config`,
    MEETING_PRESENCE: (id) => `${API_BASE}/meetings/${id}/presence`,

    // Attendance
    ATTENDANCE: `${API_BASE}/attendance`,
    ATTENDANCE_MARK: `${API_BASE}/attendance/mark`,
    ATTENDANCE_BULK: `${API_BASE}/attendance/bulk`,
    ATTENDANCE_STUDENT: (studentId) => `${API_BASE}/attendance/student/${studentId}`,
}

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    SERVER_ERROR: 500
}

export const QUERY_KEYS = {
    STUDENTS: 'students',
    STUDENT: 'student',
    TEACHERS: 'teachers',
    TEACHER: 'teacher',
    CLASSES: 'classes',
    CLASS: 'class',
    COURSES: 'courses',
    COURSE: 'course',
    TEACHER_CLASSES: 'teacherClasses',
    TEACHER_COURSES: 'teacherCourses',
    ATTENDANCE: 'attendance'
}
