import Meeting from './meeting.model.js'
import Course from '../course/course.model.js'
import UserCourse from '../user/userCourse.model.js'
import User from '../user/user.model.js'
import { success, successWithPagination } from '../../utils/response.js'
import { AuthorizationError, NotFoundError } from '../../utils/customErrors.js'
import { PAGINATION } from '../../utils/constants.js'
import { logger } from '../../utils/logger.js'

const getRoomName = (meeting) => `meeting-${meeting._id}`
const getJitsiDomain = () => {
    const rawDomain = process.env.JITSI_DOMAIN || 'meet.jit.si'
    return rawDomain
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
}
const getMeetingLink = (meeting) => `https://${getJitsiDomain()}/${getRoomName(meeting)}`
const getJitsiIssuer = () => process.env.JITSI_ISSUER || process.env.JITSI_APP_ID || 'coaching-erp'
const getJitsiAudience = () => process.env.JITSI_AUDIENCE || 'jitsi'
const isJitsiAuthEnabled = () => {
    const value = String(process.env.JITSI_AUTH_ENABLED || '').trim().toLowerCase()
    return value === 'true' || value === '1' || value === 'yes'
}

const isPublicJitsiDomain = () => {
    const domain = getJitsiDomain().toLowerCase()
    return domain === 'meet.jit.si' || domain === 'www.meet.jit.si'
}

const canUseJitsiJwt = () => isJitsiAuthEnabled() && !isPublicJitsiDomain()

const canTeacherJoinMeeting = (meeting, userId) => {
    if (!meeting?.teacher) return false
    return String(meeting.teacher) === String(userId)
}

const canStudentJoinMeeting = async (meeting, userId) => {
    if (!meeting?.course) return false

    const enrollment = await UserCourse.findOne({
        user: userId,
        course: meeting.course,
        ...(meeting.teacher ? {
            $or: [
                { teacher: meeting.teacher },
                { teacher: null }
            ]
        } : {}),
        status: { $in: ['enrolled', 'in-progress', 'completed'] }
    }).select('_id')

    return !!enrollment
}

const ensureMeetingJoinAccess = async (meeting, req) => {
    const userRole = req.user?.role
    const userId = req.user?.id

    let hasAccess = userRole === 'admin'

    if (!hasAccess && userRole === 'teacher') {
        hasAccess = canTeacherJoinMeeting(meeting, userId)
    }

    if (!hasAccess && userRole === 'student') {
        hasAccess = await canStudentJoinMeeting(meeting, userId)
    }

    if (!hasAccess) {
        throw new AuthorizationError('You do not have access to join this meeting')
    }

    return { userRole, userId }
}

// Meeting CRUD
export const createMeeting = async (req, reply) => {
    const payload = {
        ...req.body,
        teacher: req.user.id
    }

    if (payload.course) {
        const assignedCourse = await Course.findOne({
            _id: payload.course,
            $or: [
                { teacher: req.user.id },
                { teachers: req.user.id }
            ],
            isActive: true
        }).select('_id')

        if (!assignedCourse) {
            throw new AuthorizationError('You can only create meetings for your assigned courses')
        }
    }

    const data = await Meeting.create(payload)
    logger.info(`Meeting created: ${data._id}`)
    return success(reply, data, 'Meeting created successfully', 201)
}

export const getMeetings = async (req, reply) => {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT)
    const skip = (page - 1) * limit

    const filter = { isActive: true }
    const userRole = req.user?.role
    const userId = req.user?.id

    if (userRole === 'teacher') {
        filter.teacher = userId
    }

    // Filter by course, teacher, or date if provided
    if (req.query.courseId) filter.course = req.query.courseId
    if (req.query.teacherId) filter.teacher = req.query.teacherId
    if (req.query.date) {
        const startOfDay = new Date(req.query.date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(req.query.date)
        endOfDay.setHours(23, 59, 59, 999)
        filter.date = { $gte: startOfDay, $lte: endOfDay }
    }
    if (req.query.status) filter.status = req.query.status

    const [data, total] = await Promise.all([
        Meeting.find(filter)
            .populate('course', 'title level')
            .populate('teacher', 'name email')
            .skip(skip)
            .limit(limit)
            .sort('date startTime'),
        Meeting.countDocuments(filter)
    ])

    return successWithPagination(reply, data, { page, limit, total }, 'Meetings fetched successfully')
}

export const getMeetingById = async (req, reply) => {
    const data = await Meeting.findById(req.params.id)
        .populate('course', 'title level')
        .populate('teacher', 'name email')

    if (!data) {
        throw new NotFoundError('Meeting', req.params.id)
    }

    return success(reply, data, 'Meeting fetched successfully', 200)
}

export const updateMeeting = async (req, reply) => {
    const data = await Meeting.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    )
        .populate('course', 'title level')
        .populate('teacher', 'name email')

    if (!data) {
        throw new NotFoundError('Meeting', req.params.id)
    }

    logger.info(`Meeting updated: ${data._id}`)
    return success(reply, data, 'Meeting updated successfully', 200)
}

export const deleteMeeting = async (req, reply) => {
    const userRole = req.user?.role
    const userId = req.user?.id

    const filter = { _id: req.params.id }
    if (userRole === 'teacher') {
        filter.teacher = userId
    }

    const data = await Meeting.findOneAndUpdate(
        filter,
        { isActive: false },
        { new: true }
    )

    if (!data) {
        throw new NotFoundError('Meeting', req.params.id)
    }

    logger.info(`Meeting deleted: ${data._id}`)
    return success(reply, data, 'Meeting deleted successfully', 200)
}

export const cancelMeeting = async (req, reply) => {
    const data = await Meeting.findByIdAndUpdate(
        req.params.id,
        { status: 'cancelled' },
        { new: true }
    )
        .populate('course', 'title level')
        .populate('teacher', 'name email')

    if (!data) {
        throw new NotFoundError('Meeting', req.params.id)
    }

    logger.info(`Meeting cancelled: ${data._id}`)
    return success(reply, data, 'Meeting cancelled successfully', 200)
}

export const generateMeetingLink = async (req, reply) => {
    const meeting = await Meeting.findById(req.params.id)

    if (!meeting) {
        throw new NotFoundError('Meeting', req.params.id)
    }

    // Generate Jitsi meeting link
    const meetingLink = getMeetingLink(meeting)

    // Update meeting with link
    meeting.meetingLink = meetingLink
    await meeting.save()

    logger.info(`Meeting link generated: ${meeting._id}`)
    return success(reply, { meetingLink, joinUrl: meetingLink }, 'Meeting link generated successfully', 200)
}

export const getMeetingJoinConfig = async (req, reply) => {
    const meeting = await Meeting.findById(req.params.id)
        .populate('course', 'title')

    if (!meeting || !meeting.isActive || meeting.status === 'cancelled') {
        throw new NotFoundError('Meeting')
    }

    const { userRole, userId } = await ensureMeetingJoinAccess(meeting, req)

    const user = await User.findById(userId).select('name email role')
    const meetingLink = meeting.meetingLink || getMeetingLink(meeting)

    if (!meeting.meetingLink) {
        meeting.meetingLink = meetingLink
        await meeting.save()
    }

    const isModerator = userRole === 'teacher' || userRole === 'admin'

    const shouldUseJitsiJwt = canUseJitsiJwt()

    const joinToken = shouldUseJitsiJwt
        ? req.server.jwt.sign(
            {
                aud: getJitsiAudience(),
                iss: getJitsiIssuer(),
                sub: getJitsiDomain(),
                room: getRoomName(meeting),
                purpose: 'jitsi-join',
                meetingId: String(meeting._id),
                userId: String(userId),
                role: userRole,
                moderator: isModerator,
                meetingRole: isModerator ? 'moderator' : 'participant',
                context: {
                    user: {
                        id: String(userId),
                        name: user?.name || req.body?.displayName || 'Guest',
                        email: user?.email || '',
                        moderator: isModerator
                    },
                    features: {
                        livestreaming: isModerator,
                        recording: isModerator,
                        transcription: false,
                        'outbound-call': false
                    }
                }
            },
            { expiresIn: '15m' }
        )
        : null

    const joinUrl = joinToken
        ? `${meetingLink}?joinToken=${encodeURIComponent(joinToken)}`
        : meetingLink

    return success(
        reply,
        {
            domain: getJitsiDomain(),
            roomName: getRoomName(meeting),
            meetingLink,
            joinUrl,
            joinToken,
            expiresIn: 900,
            jitsiAuthEnabled: shouldUseJitsiJwt,
            user: {
                id: String(userId),
                name: user?.name || req.body?.displayName || 'Guest',
                email: user?.email || '',
                role: userRole
            }
        },
        'Meeting join configuration generated successfully',
        200
    )
}

export const recordMeetingPresence = async (req, reply) => {
    const meeting = await Meeting.findById(req.params.id)

    if (!meeting || !meeting.isActive || meeting.status === 'cancelled') {
        throw new NotFoundError('Meeting')
    }

    const { userRole, userId } = await ensureMeetingJoinAccess(meeting, req)
    const event = req.body?.event === 'leave' ? 'leave' : 'join'
    const providedDate = req.body?.occurredAt ? new Date(req.body.occurredAt) : null
    const occurredAt = providedDate && !Number.isNaN(providedDate.getTime())
        ? providedDate
        : new Date()

    meeting.presenceEvents.push({
        user: userId,
        role: userRole,
        event,
        occurredAt
    })

    if (event === 'join' && meeting.status === 'scheduled') {
        meeting.status = 'ongoing'
    }

    await meeting.save()

    return success(
        reply,
        {
            meetingId: String(meeting._id),
            event,
            occurredAt
        },
        'Meeting presence recorded successfully',
        200
    )
}

export const getMeetingsByTeacher = async (req, reply) => {
    const data = await Meeting.find({
        teacher: req.params.teacherId,
        isActive: true
    })
        .populate('course', 'title level')
        .populate('teacher', 'name email')
        .sort('date startTime')

    return success(reply, data, 'Teacher meetings fetched successfully', 200)
}

export const getUpcomingMeetings = async (req, reply) => {
    const now = new Date()
    const data = await Meeting.find({
        date: { $gte: now },
        status: { $in: ['scheduled', 'ongoing'] },
        isActive: true
    })
        .populate('course', 'title level')
        .populate('teacher', 'name email')
        .sort('date startTime')
        .limit(20)

    return success(reply, data, 'Upcoming meetings fetched successfully', 200)
}

export const getMeetingsForStudent = async (req, reply) => {
    try {
        const { userId } = req.params

        // Get all courses the student is enrolled in
        const enrollments = await UserCourse.find({
            user: userId,
            status: { $in: ['enrolled', 'in-progress', 'completed'] }
        }).select('course teacher')

        const meetingFilters = enrollments
            .map((enrollment) => ({
                course: enrollment.course,
                ...(enrollment.teacher ? { teacher: enrollment.teacher } : {})
            }))

        // Get all meetings for those courses
        const meetings = meetingFilters.length > 0
            ? await Meeting.find({
                $or: meetingFilters,
                isActive: true
            })
                .populate('course', 'title level')
                .populate('teacher', 'name email')
                .sort('date startTime')
            : []

        return success(reply, meetings, 'Student meetings fetched successfully', 200)
    } catch (error) {
        logger.error('Error fetching student meetings', { error: error.message })
        throw error
    }
}
