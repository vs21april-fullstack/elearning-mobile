import * as yup from 'yup'

export const createMeetingSchema = yup.object({
    title: yup.string().required('Title is required'),
    teacher: yup.string(),
    course: yup.string().required('Course is required'),
    date: yup.string().required('Date is required'),
    startTime: yup.string().required('Start time is required'),
    endTime: yup.string()
        .required('End time is required')
        .test('is-after-start', 'End time must be after start time', function (value) {
            const { startTime } = this.parent
            if (!startTime || !value) return true
            return value > startTime
        }),
    notes: yup.string()
})

export const updateMeetingSchema = yup.object({
    title: yup.string(),
    course: yup.string(),
    teacher: yup.string(),
    date: yup.string(),
    startTime: yup.string(),
    endTime: yup.string()
        .test('is-after-start', 'End time must be after start time', function (value) {
            const { startTime } = this.parent
            if (!startTime || !value) return true
            return value > startTime
        }),
    status: yup.string().oneOf(['scheduled', 'ongoing', 'completed', 'cancelled']),
    notes: yup.string(),
    isActive: yup.boolean()
})

export const recordMeetingPresenceSchema = yup.object({
    event: yup.string().oneOf(['join', 'leave']).required('Event is required'),
    occurredAt: yup.date().nullable()
})
