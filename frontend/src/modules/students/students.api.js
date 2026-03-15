/**
 * Students API
 * API functions for student management
 */

import api from '../../app/axios'
import { API_ENDPOINTS } from '../../utils/constants'

const normalizeParentDetails = (parents) => {
    if (!parents || typeof parents !== 'object') return null

    const normalizePerson = (person) => {
        if (!person || typeof person !== 'object') return null

        const name = typeof person.name === 'string' ? person.name.trim() : ''
        const phone = typeof person.phone === 'string' ? person.phone.trim() : ''

        if (!name && !phone) return null
        return { ...(name ? { name } : {}), ...(phone ? { phone } : {}) }
    }

    const father = normalizePerson(parents.father)
    const mother = normalizePerson(parents.mother)

    if (!father && !mother) return null
    return { ...(father ? { father } : {}), ...(mother ? { mother } : {}) }
}

export const fetchStudents = async (params = {}) => {
    const { page = 1, limit = 10 } = params
    const res = await api.get(API_ENDPOINTS.STUDENTS, {
        params: { page, limit }
    })
    return {
        data: res.data.data.filter(u => u.role === 'student'),
        pagination: res.data.pagination
    }
}

export const fetchStudentById = async (id) => {
    const res = await api.get(API_ENDPOINTS.STUDENT(id))
    return res.data.data
}

export const fetchCourses = async () => {
    const res = await api.get(API_ENDPOINTS.COURSES)
    return res.data.data
}

export const enrollStudentInCourse = async ({ userId, courseId, teacherId }) => {
    const res = await api.post(API_ENDPOINTS.ENROLL_COURSE, { userId, courseId, teacherId })
    return res.data.data
}

export const unenrollStudentFromCourse = async ({ userId, courseId }) => {
    const res = await api.delete(API_ENDPOINTS.UNENROLL_COURSE(userId, courseId))
    return res.data.data
}

export const getStudentCourses = async (userId) => {
    const res = await api.get(API_ENDPOINTS.STUDENT_COURSES(userId))
    return res.data.data
}

export const addStudent = async (studentData) => {
    const payload = {
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone,
        password: studentData.password
    }

    const normalizedParents = normalizeParentDetails(studentData.parents)
    if (normalizedParents) {
        payload.parents = normalizedParents
    }

    const res = await api.post(API_ENDPOINTS.STUDENTS, payload)
    return res.data.data
}

export const updateStudent = async ({ id, studentData }) => {
    const payload = {
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone
    }

    const normalizedParents = normalizeParentDetails(studentData.parents)
    if (normalizedParents) {
        payload.parents = normalizedParents
    }

    if (studentData.password) {
        payload.password = studentData.password
    }

    const res = await api.put(API_ENDPOINTS.STUDENT(id), payload)
    return res.data.data
}

export const deleteStudent = async (id) => {
    const res = await api.delete(API_ENDPOINTS.STUDENT(id))
    return res.data.data
}