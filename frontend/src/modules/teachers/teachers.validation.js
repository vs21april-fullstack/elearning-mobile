import * as yup from 'yup'

export const createTeacherSchema = yup.object({
    name: yup.string().required('Name is required'),
    phone: yup.string().required('Phone is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    teacherProfile: yup.object({
        qualifications: yup.array().of(
            yup.object({
                degree: yup.string().trim().notRequired(),
                university: yup.string().trim().notRequired()
            })
        ).notRequired(),
        experiences: yup.array().of(
            yup.object({
                title: yup.string().trim().notRequired(),
                company: yup.string().trim().notRequired(),
                startYear: yup.number()
                    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
                    .notRequired()
                    .min(1950, 'Invalid year'),
                endYear: yup.number()
                    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
                    .notRequired()
                    .min(1950, 'Invalid year')
                    .nullable(),
                isCurrent: yup.boolean().notRequired()
            })
        ).notRequired()
    }).notRequired()
})

export const updateTeacherSchema = yup.object({
    name: yup.string().required('Name is required'),
    phone: yup.string().required('Phone is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').notRequired(),
    teacherProfile: yup.object({
        qualifications: yup.array().of(
            yup.object({
                degree: yup.string().trim().notRequired(),
                university: yup.string().trim().notRequired()
            })
        ).notRequired(),
        experiences: yup.array().of(
            yup.object({
                title: yup.string().trim().notRequired(),
                company: yup.string().trim().notRequired(),
                startYear: yup.number()
                    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
                    .notRequired()
                    .min(1950, 'Invalid year'),
                endYear: yup.number()
                    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
                    .notRequired()
                    .min(1950, 'Invalid year')
                    .nullable(),
                isCurrent: yup.boolean().notRequired()
            })
        ).notRequired()
    }).notRequired()
})
