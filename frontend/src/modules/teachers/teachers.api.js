/**
 * Teachers API
 * API functions for teacher management
 */

import api from '../../app/axios'
import { API_ENDPOINTS } from '../../utils/constants'

export const fetchTeachers = async (params = {}) => {
    const { page = 1, limit = 10 } = params
    const res = await api.get(API_ENDPOINTS.TEACHERS, {
        params: { page, limit }
    })
    return {
        data: res.data.data,
        pagination: res.data.pagination
    }
}

export const fetchTeacherById = async (id) => {
    const res = await api.get(API_ENDPOINTS.TEACHER(id))
    return res.data.data
}

export const addTeacher = async (teacherData) => {
    const payload = {
        name: teacherData.name,
        email: teacherData.email,
        phone: teacherData.phone,
        password: teacherData.password,
        teacherProfile: teacherData.teacherProfile,
    }

    const res = await api.post(API_ENDPOINTS.TEACHERS, payload)
    return res.data.data
}

export const updateTeacher = async ({ id, teacherData }) => {
    const payload = {
        ...(teacherData.name !== undefined ? { name: teacherData.name } : {}),
        ...(teacherData.email !== undefined ? { email: teacherData.email } : {}),
        ...(teacherData.phone !== undefined ? { phone: teacherData.phone } : {}),
        ...(teacherData.teacherProfile !== undefined ? { teacherProfile: teacherData.teacherProfile } : {}),
        ...(teacherData.isActive !== undefined ? { isActive: teacherData.isActive } : {}),
    }

    if (teacherData.password) {
        payload.password = teacherData.password
    }

    const res = await api.put(API_ENDPOINTS.TEACHER(id), payload)
    return res.data.data
}

export const deleteTeacher = async (id) => {
    const res = await api.delete(API_ENDPOINTS.TEACHER(id))
    return res.data.data
}