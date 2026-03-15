import User from '../user/user.model.js'
import Course from '../course/course.model.js'
import { success } from '../../utils/response.js'
import { logger } from '../../utils/logger.js'

export const getDashboardStats = async (req, reply) => {
    try {
        const [studentCount, teacherCount, courseCount] = await Promise.all([
            User.countDocuments({ role: 'student', isActive: true }),
            User.countDocuments({ role: 'teacher', isActive: true }),
            Course.countDocuments({ isActive: true })
        ])

        const stats = {
            students: studentCount,
            teachers: teacherCount,
            courses: courseCount,
            revenue: 50000 // This could be calculated from actual payment data
        }

        logger.info('Dashboard stats fetched successfully')
        return success(reply, stats, 'Dashboard stats fetched successfully', 200)
    } catch (err) {
        logger.error('Error fetching dashboard stats', { error: err.message })
        throw err
    }
}
