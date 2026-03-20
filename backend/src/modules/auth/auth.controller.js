import bcrypt from 'bcrypt'
import User from '../user/user.model.js'
import Attendance from '../attendance/attendance.model.js'
import { success, error } from '../../utils/response.js'

export const login = async (req, reply) => {
  try {
    const { email, password } = req.body

    // Include password explicitly
    const user = await User.findByEmailOrPhone(email, true)

    if (!user || !user.password || !user.isActive) {
      return error(reply, 'Invalid credentials', 401)
    }

    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return error(reply, 'Invalid credentials', 401)
    }

    const token = req.server.jwt.sign({
      id: user._id,
      role: user.role
    })

    // Record login attendance
    try {
      await Attendance.recordLogin(user._id)
    } catch (attendanceError) {
      req.log.error('Failed to record login attendance:', attendanceError)
      // Don't fail the login due to attendance recording failure
    }

    return success(
      reply,
      {
        token,
        role: user.role
      },
      'Login successful'
    )

  } catch (err) {
    req.log.error(err) // fastify logger
    return error(reply, 'Something went wrong', 500)
  }
}