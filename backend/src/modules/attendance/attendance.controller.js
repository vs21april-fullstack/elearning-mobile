import Attendance from './attendance.model.js'
import User from '../user/user.model.js'
import UserClass from '../user/userClass.model.js'
import Class from '../class/class.model.js'
import { success } from '../../utils/response.js'

// Mark single attendance
export const markAttendance = async (req, reply) => {
    const { studentId, classId, date, status, remarks } = req.body
    const markedBy = req.user.id

    const attendance = await Attendance.markAttendance(
        studentId,
        classId,
        date,
        status,
        markedBy,
        remarks
    )

    return success(reply, attendance, 'Attendance marked successfully', 201)
}

// Bulk mark attendance for multiple students
export const bulkMarkAttendance = async (req, reply) => {
    const { attendanceRecords } = req.body
    const markedBy = req.user.id

    const result = await Attendance.bulkMarkAttendance(attendanceRecords, markedBy)

    return success(reply, result, 'Bulk attendance marked successfully', 201)
}

// Get attendance for a class on a specific date
export const getClassAttendance = async (req, reply) => {
    const { classId, date } = req.query

    if (!classId || !date) {
        return reply.code(400).send({ message: 'classId and date are required' })
    }

    const attendance = await Attendance.getClassAttendance(classId, new Date(date))

    return success(reply, attendance, 'Class attendance fetched successfully', 200)
}

// Get attendance for a student in a date range
export const getStudentAttendance = async (req, reply) => {
    const { studentId } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
        return reply.code(400).send({ message: 'startDate and endDate are required' })
    }

    const attendance = await Attendance.getStudentAttendance(
        studentId,
        new Date(startDate),
        new Date(endDate)
    )

    return success(reply, attendance, 'Student attendance fetched successfully', 200)
}

// Get attendance statistics for a student in a class
export const getAttendanceStats = async (req, reply) => {
    const { studentId, classId } = req.params

    const stats = await Attendance.getAttendanceStats(studentId, classId)

    return success(reply, stats, 'Attendance statistics fetched successfully', 200)
}

// Update attendance record
export const updateAttendance = async (req, reply) => {
    const { id } = req.params
    const { status, remarks } = req.body

    const attendance = await Attendance.findByIdAndUpdate(
        id,
        {
            status,
            remarks,
            checkInTime: status === 'present' || status === 'late' ? new Date() : null
        },
        { new: true, runValidators: true }
    )

    if (!attendance) {
        return reply.code(404).send({ message: 'Attendance record not found' })
    }

    return success(reply, attendance, 'Attendance updated successfully', 200)
}

// Delete attendance record
export const deleteAttendance = async (req, reply) => {
    const { id } = req.params

    const attendance = await Attendance.findByIdAndDelete(id)

    if (!attendance) {
        return reply.code(404).send({ message: 'Attendance record not found' })
    }

    return success(reply, attendance, 'Attendance deleted successfully', 200)
}

// Get attendance report for a class (all students, date range)
export const getAttendanceReport = async (req, reply) => {
    const { classId } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
        return reply.code(400).send({ message: 'startDate and endDate are required' })
    }

    const attendance = await Attendance.find({
        class: classId,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
        .populate('student', 'name email phone')
        .populate('markedBy', 'name')
        .sort('date student')

    // Group by student
    const report = attendance.reduce((acc, record) => {
        const studentId = record.student._id.toString()
        if (!acc[studentId]) {
            acc[studentId] = {
                student: record.student,
                records: []
            }
        }
        acc[studentId].records.push({
            date: record.date,
            status: record.status,
            remarks: record.remarks,
            markedBy: record.markedBy
        })
        return acc
    }, {})

    return success(reply, Object.values(report), 'Attendance report fetched successfully', 200)
}
// Record user logout
export const recordLogout = async (req, reply) => {
    const userId = req.user.id

    try {
        const attendance = await Attendance.recordLogout(userId)

        if (!attendance) {
            return reply.code(404).send({ message: 'No login record found for today' })
        }

        return success(reply, attendance, 'Logout recorded successfully', 200)
    } catch (err) {
        req.log.error(err)
        return reply.code(500).send({ message: 'Failed to record logout' })
    }
}

// Get user login attendance (teachers and students login history)
export const getUserLoginAttendance = async (req, reply) => {
    const { startDate, endDate, role, classId } = req.query

    if (!startDate || !endDate) {
        return reply.code(400).send({ message: 'startDate and endDate are required' })
    }

    try {
        const query = {
            type: 'login',
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }

        const validRoles = ['student', 'teacher']
        const roleFilter = validRoles.includes(role) ? role : null

        if (req.user.role === 'student') {
            query.user = req.user.id
        } else {
            let userIds = null

            if (classId && roleFilter === 'student') {
                const enrolledStudents = await UserClass.find({ class: classId, status: 'active' }).select('user')
                userIds = enrolledStudents.map((entry) => entry.user)
            } else if (classId && roleFilter === 'teacher') {
                const selectedClass = await Class.findById(classId).select('teacher')
                userIds = selectedClass?.teacher ? [selectedClass.teacher] : []
            } else if (roleFilter) {
                const users = await User.find({ role: roleFilter, isActive: true }).select('_id')
                userIds = users.map((entry) => entry._id)
            }

            if (Array.isArray(userIds)) {
                query.user = { $in: userIds }
            }
        }

        const attendance = await Attendance.find(query)
            .populate('user', 'name email role')
            .sort({ date: -1, checkInTime: -1 })

        return success(reply, attendance, 'Login attendance fetched successfully', 200)
    } catch (err) {
        req.log.error(err)
        return reply.code(500).send({ message: 'Failed to fetch login attendance' })
    }
}