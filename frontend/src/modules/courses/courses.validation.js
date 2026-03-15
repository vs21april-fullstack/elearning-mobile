import * as yup from 'yup'

export const createCourseSchema = yup.object({
    title: yup.string().required('Title is required'),
    description: yup.string(),
})

export const updateCourseSchema = yup.object({
    title: yup.string(),
    description: yup.string(),
    teacher: yup.string(),
})
