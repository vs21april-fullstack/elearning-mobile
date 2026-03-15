import api from '../../app/axios'

// Mark single attendance
export const markAttendance = async (attendanceData) => {
    const res = await api.post('/attendance/mark', attendanceData)
    return res.data.data
}

// Bulk mark attendance for multiple students
export const bulkMarkAttendance = async (attendanceRecords) => {
    const res = await api.post('/attendance/bulk-mark', { attendanceRecords })
    return res.data.data
}

// Get attendance for a class on a specific date
export const getClassAttendance = async (classId, date) => {
    const res = await api.get('/attendance/class', {
        params: { classId, date }
    })
    return res.data.data
}

// Get attendance for a student in a date range
export const getStudentAttendance = async (studentId, startDate, endDate) => {
    const res = await api.get(`/attendance/student/${studentId}`, {
        params: { startDate, endDate }
    })
    return res.data.data
}

// Get attendance statistics for a student in a class
export const getAttendanceStats = async (studentId, classId) => {
    const res = await api.get(`/attendance/stats/${studentId}/${classId}`)
    return res.data.data
}

// Get attendance report for a class
export const getAttendanceReport = async (classId, startDate, endDate) => {
    const res = await api.get(`/attendance/report/${classId}`, {
        params: { startDate, endDate }
    })
    return res.data.data
}

// Update attendance record
export const updateAttendance = async (id, attendanceData) => {
    const res = await api.put(`/attendance/${id}`, attendanceData)
    return res.data.data
}

// Record logout
export const recordLogout = async () => {
    const res = await api.post('/attendance/logout')
    return res.data.data
}

// Get user login/logout history with optional role and class filters
export const getUserLoginAttendance = async (startDate, endDate, role, classId) => {
    const res = await api.get('/attendance/login-history', {
        params: { startDate, endDate, ...(role && { role }), ...(classId && { classId }) }
    })
    return res.data.data
}
// Delete attendance record
export const deleteAttendance = async (id) => {
    const res = await api.delete(`/attendance/${id}`)
    return res.data.data
}
