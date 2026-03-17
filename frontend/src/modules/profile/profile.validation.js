/**
 * Profile Validation Schemas
 * Validation rules for profile forms
 */

import * as Yup from 'yup';

export const updateProfileSchema = Yup.object({
    name: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .required('Name is required'),
    email: Yup.string()
        .email('Invalid email format')
        .required('Email is required'),
    phone: Yup.string()
        .required('Phone is required'),
    parents: Yup.object({
        father: Yup.object({
            name: Yup.string().nullable(),
            phone: Yup.string().nullable(),
        }).nullable(),
        mother: Yup.object({
            name: Yup.string().nullable(),
            phone: Yup.string().nullable(),
        }).nullable(),
    }).nullable(),
    teacherProfile: Yup.object({
        qualifications: Yup.array().of(
            Yup.object({
                degree: Yup.string().nullable(),
                university: Yup.string().nullable(),
            })
        ).nullable(),
        experiences: Yup.array().of(
            Yup.object({
                title: Yup.string().nullable(),
                company: Yup.string().nullable(),
                startYear: Yup.number().nullable(),
                endYear: Yup.number().nullable(),
                isCurrent: Yup.boolean().nullable(),
            })
        ).nullable(),
    }).nullable(),
});

export const changePasswordSchema = Yup.object({
    currentPassword: Yup.string()
        .required('Current password is required'),
    newPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Confirm password is required')
});
