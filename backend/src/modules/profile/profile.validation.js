import * as yup from 'yup';
import { PASSWORD_MIN_LENGTH } from '../../utils/constants.js';

export const updateProfileSchema = yup.object({
    name: yup.string().trim().min(2, 'Name must be at least 2 characters'),
    email: yup.string().email('Invalid email format'),
    phone: yup.string().optional(),
    parents: yup.object({
        father: yup.object({
            name: yup.string().nullable(),
            phone: yup.string().nullable()
        }).nullable(),
        mother: yup.object({
            name: yup.string().nullable(),
            phone: yup.string().nullable()
        }).nullable()
    }).nullable(),
    teacherProfile: yup.object({
        qualifications: yup.array().of(
            yup.object({
                degree: yup.string().nullable(),
                university: yup.string().nullable()
            })
        ).nullable(),
        experiences: yup.array().of(
            yup.object({
                title: yup.string().nullable(),
                company: yup.string().nullable(),
                startYear: yup.number().nullable(),
                endYear: yup.number().nullable(),
                isCurrent: yup.boolean().nullable()
            })
        ).nullable()
    }).nullable()
});

export const changePasswordSchema = yup.object({
    currentPassword: yup.string().required('Current password is required'),
    newPassword: yup.string()
        .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
        .required('New password is required'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('newPassword')], 'Passwords must match')
        .required('Confirm password is required')
});
