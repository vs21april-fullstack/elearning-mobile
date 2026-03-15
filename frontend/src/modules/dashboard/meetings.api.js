/**
 * Meetings API
 * Fetch meetings for student/teacher meetings dashboard
 */

import api from "../../app/axios";
import { API_ENDPOINTS } from "../../utils/constants";

export const fetchMeetingsForStudent = async (studentId) => {
    const res = await api.get(`${API_ENDPOINTS.MEETINGS}/student/${studentId}`);
    return res.data.data;
};

export const fetchMeetingsForTeacher = async (teacherId) => {
    const res = await api.get(`${API_ENDPOINTS.MEETING_TEACHER(teacherId)}`);
    return res.data.data;
};
