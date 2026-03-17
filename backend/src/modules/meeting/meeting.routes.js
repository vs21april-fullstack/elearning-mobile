import {
    createMeeting,
    getMeetings,
    getMeetingById,
    updateMeeting,
    deleteMeeting,
    cancelMeeting,
    generateMeetingLink,
    getMeetingJoinConfig,
    recordMeetingPresence,
    getMeetingsByTeacher,
    getUpcomingMeetings,
    getMeetingsForStudent
} from './meeting.controller.js'
import {
    createMeetingSchema,
    updateMeetingSchema,
    recordMeetingPresenceSchema
} from './meeting.validation.js'
import { validate } from '../../utils/validate.js'
import { roleGuard } from '../../plugins/roleGuard.js'

export default async function (app) {
    // Meeting CRUD
    app.post(
        '/',
        { preHandler: [roleGuard(['admin', 'teacher']), validate(createMeetingSchema)] },
        createMeeting
    )

    app.get(
        '/',
        { preHandler: roleGuard(['admin', 'teacher', 'student']) },
        getMeetings
    )

    app.get(
        '/upcoming',
        { preHandler: roleGuard(['admin', 'teacher', 'student']) },
        getUpcomingMeetings
    )

    app.get(
        '/student/:userId',
        { preHandler: roleGuard(['admin', 'teacher', 'student']) },
        getMeetingsForStudent
    )

    app.get(
        '/:id',
        { preHandler: roleGuard(['admin', 'teacher', 'student']) },
        getMeetingById
    )

    app.put(
        '/:id',
        { preHandler: [roleGuard(['admin', 'teacher']), validate(updateMeetingSchema)] },
        updateMeeting
    )

    app.delete(
        '/:id',
        { preHandler: roleGuard(['admin', 'teacher']) },
        deleteMeeting
    )

    // Meeting actions
    app.post(
        '/:id/cancel',
        { preHandler: roleGuard(['admin', 'teacher']) },
        cancelMeeting
    )

    app.post(
        '/:id/generate-link',
        { preHandler: roleGuard(['admin', 'teacher']) },
        generateMeetingLink
    )

    app.post(
        '/:id/join-config',
        { preHandler: roleGuard(['admin', 'teacher', 'student']) },
        getMeetingJoinConfig
    )

    app.post(
        '/:id/presence',
        {
            preHandler: [
                roleGuard(['admin', 'teacher', 'student']),
                validate(recordMeetingPresenceSchema)
            ]
        },
        recordMeetingPresence
    )

    // Get meetings by teacher
    app.get(
        '/teacher/:teacherId',
        { preHandler: roleGuard(['admin', 'teacher']) },
        getMeetingsByTeacher
    )
}
