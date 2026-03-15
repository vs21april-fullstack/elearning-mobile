/**
 * Meetings API
 * API functions for meeting management
 */

import api from '../../app/axios'
import { API_ENDPOINTS } from '../../utils/constants'

export const fetchMeetings = async (params = {}) => {
    const { page = 1, limit = 10, courseId, teacherId, date, status } = params
    const res = await api.get(API_ENDPOINTS.MEETINGS, {
        params: { page, limit, courseId, teacherId, date, status }
    })
    return {
        data: res.data.data,
        pagination: res.data.pagination
    }
}

export const fetchMeetingById = async (id) => {
    const res = await api.get(API_ENDPOINTS.MEETING(id))
    return res.data.data
}

export const fetchUpcomingMeetings = async () => {
    const res = await api.get(API_ENDPOINTS.MEETING_UPCOMING)
    return res.data.data
}

export const fetchMeetingsByTeacher = async (teacherId) => {
    const res = await api.get(API_ENDPOINTS.MEETING_TEACHER(teacherId))
    return res.data.data
}

export const fetchMeetingsForStudent = async (studentId) => {
    const res = await api.get(`${API_ENDPOINTS.MEETINGS}/student/${studentId}`)
    return res.data.data
}

export const createMeeting = async (meetingData) => {
    const res = await api.post(API_ENDPOINTS.MEETINGS, meetingData)
    return res.data.data
}

export const updateMeeting = async ({ id, meetingData }) => {
    const res = await api.put(API_ENDPOINTS.MEETING(id), meetingData)
    return res.data.data
}

export const deleteMeeting = async (id) => {
    const res = await api.delete(API_ENDPOINTS.MEETING(id))
    return res.data.data
}

export const cancelMeeting = async (id) => {
    const res = await api.post(API_ENDPOINTS.MEETING_CANCEL(id))
    return res.data.data
}

export const generateMeetingLink = async (id) => {
    const res = await api.post(API_ENDPOINTS.MEETING_GENERATE_LINK(id))
    return res.data.data
}

export const fetchMeetingJoinConfig = async (id, payload = {}) => {
    const res = await api.post(API_ENDPOINTS.MEETING_JOIN_CONFIG(id), payload)
    return res.data.data
}

export const recordMeetingPresence = async (id, payload) => {
    const res = await api.post(API_ENDPOINTS.MEETING_PRESENCE(id), payload)
    return res.data.data
}
