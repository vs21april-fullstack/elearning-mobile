import UserClass from '../user/userClass.model.js'
import { success } from '../../utils/response.js'

// Enroll student in a class
export const enrollStudentInClass = async (req, reply) => {
    const { userId, classId } = req.body
    const data = await UserClass.enrollStudent(userId, classId)
    return success(reply, data, 'Student enrolled in class successfully', 201)
}

// Get all classes for a student
export const getStudentClasses = async (req, reply) => {
    const data = await UserClass.getStudentClasses(req.params.userId)
    return success(reply, data, 'Student classes fetched successfully', 200)
}

// Get all students in a class
export const getClassStudents = async (req, reply) => {
    const data = await UserClass.getClassStudents(req.params.classId)
    return success(reply, data, 'Class students fetched successfully', 200)
}

// Update class progress
export const updateClassProgress = async (req, reply) => {
    const { userId, classId, progress } = req.body
    const enrollment = await UserClass.findOne({ user: userId, class: classId })

    if (!enrollment) {
        return reply.code(404).send({ message: 'Enrollment not found' })
    }

    enrollment.progress = progress
    if (progress === 100 && enrollment.status !== 'completed') {
        enrollment.status = 'completed'
    }

    await enrollment.save()
    return success(reply, enrollment, 'Class progress updated successfully', 200)
}

// Unenroll student from class
export const unenrollStudentFromClass = async (req, reply) => {
    const { userId, classId } = req.params
    const data = await UserClass.findOneAndUpdate(
        { user: userId, class: classId },
        { status: 'dropped' },
        { new: true }
    )

    if (!data) {
        // If enrollment doesn't exist, that's fine - student is already not enrolled
        return success(reply, null, 'Student is not enrolled in this class', 200)
    }

    return success(reply, data, 'Student unenrolled from class successfully', 200)
}
