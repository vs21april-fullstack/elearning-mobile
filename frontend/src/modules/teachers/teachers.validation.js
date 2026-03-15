import * as yup from 'yup'

export const createTeacherSchema = yup.object({
    name: yup.string().required('Name is required'),
    phone: yup.string().required('Phone is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    teacherProfile: yup.object({
        qualifications: yup.array().of(
            yup.object({
                degree: yup.string().required('Degree is required'),
                university: yup.string().required('University/Institute is required')
            })
        ).min(1, 'At least one qualification is required').required(),
        experiences: yup.array().of(
            yup.object({
                title: yup.string().required('Job title is required'),
                company: yup.string().required('Company/Organization is required'),
                startYear: yup.number().required('Start year is required').min(1950, 'Invalid year'),
                endYear: yup.number().min(1950, 'Invalid year').nullable(),
                isCurrent: yup.boolean()
            })
        ).min(1, 'At least one experience is required').required()
    }).required()
})

export const updateTeacherSchema = yup.object({
    name: yup.string().required('Name is required'),
    phone: yup.string().required('Phone is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    teacherProfile: yup.object({
        qualifications: yup.array().of(
            yup.object({
                degree: yup.string().required('Degree is required'),
                university: yup.string().required('University/Institute is required')
            })
        ).min(1, 'At least one qualification is required').required(),
        experiences: yup.array().of(
            yup.object({
                title: yup.string().required('Job title is required'),
                company: yup.string().required('Company/Organization is required'),
                startYear: yup.number().required('Start year is required').min(1950, 'Invalid year'),
                endYear: yup.number().min(1950, 'Invalid year').nullable(),
                isCurrent: yup.boolean()
            })
        ).min(1, 'At least one experience is required').required()
    }).required()
})
