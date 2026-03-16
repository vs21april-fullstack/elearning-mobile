import * as yup from 'yup'

const toMinutes = (timeValue) => {
    if (typeof timeValue !== 'string') return null

    const normalized = timeValue.trim().toUpperCase()
    const match12Hour = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)

    if (match12Hour) {
        let hours = Number(match12Hour[1])
        const minutes = Number(match12Hour[2])
        const period = match12Hour[3]

        if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null

        if (period === 'AM' && hours === 12) hours = 0
        if (period === 'PM' && hours !== 12) hours += 12

        return (hours * 60) + minutes
    }

    const match24Hour = normalized.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
    if (match24Hour) {
        const hours = Number(match24Hour[1])
        const minutes = Number(match24Hour[2])
        return (hours * 60) + minutes
    }

    return null
}

const isEndTimeAfterStartTime = (startTime, endTime) => {
    const startMinutes = toMinutes(startTime)
    const endMinutes = toMinutes(endTime)

    // Let required/format validators handle invalid or empty values.
    if (startMinutes === null || endMinutes === null) return true
    if (startMinutes === endMinutes) return false

    const adjustedEndMinutes = endMinutes <= startMinutes
        ? endMinutes + (24 * 60)
        : endMinutes

    return adjustedEndMinutes > startMinutes
}

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
            return isEndTimeAfterStartTime(startTime, value)
        }),
    notes: yup.string()
})
