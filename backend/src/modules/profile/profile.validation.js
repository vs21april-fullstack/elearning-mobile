import * as yup from 'yup';
import { PASSWORD_MIN_LENGTH } from '../../utils/constants.js';

const yearField = yup.number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .nullable();

const qualificationItemSchema = yup.object({
    degree: yup.string().nullable(),
    university: yup.string().nullable()
}).test(
    'qualification-complete-if-started',
    'Degree and University are required when adding a qualification',
    function (value) {
        if (!value) return true;

        const degree = String(value.degree || '').trim();
        const university = String(value.university || '').trim();
        const hasAnyValue = Boolean(degree || university);

        if (!hasAnyValue) return true;

        if (!degree) {
            return this.createError({
                path: `${this.path}.degree`,
                message: 'Degree is required'
            });
        }

        if (!university) {
            return this.createError({
                path: `${this.path}.university`,
                message: 'University is required'
            });
        }

        return true;
    }
);

const experienceItemSchema = yup.object({
    title: yup.string().nullable(),
    company: yup.string().nullable(),
    startYear: yearField,
    endYear: yearField,
    isCurrent: yup.boolean().nullable()
}).test(
    'experience-complete-if-started',
    'Title, Company, Start Year and End Year (or Current) are required when adding experience',
    function (value) {
        if (!value) return true;

        const title = String(value.title || '').trim();
        const company = String(value.company || '').trim();
        const hasStartYear = value.startYear !== undefined && value.startYear !== null;
        const hasEndYear = value.endYear !== undefined && value.endYear !== null;
        const isCurrent = Boolean(value.isCurrent);
        const hasAnyValue = Boolean(title || company || hasStartYear || hasEndYear || isCurrent);

        if (!hasAnyValue) return true;

        if (!title) {
            return this.createError({
                path: `${this.path}.title`,
                message: 'Title is required'
            });
        }

        if (!company) {
            return this.createError({
                path: `${this.path}.company`,
                message: 'Company is required'
            });
        }

        if (!hasStartYear) {
            return this.createError({
                path: `${this.path}.startYear`,
                message: 'Start Year is required'
            });
        }

        if (!isCurrent && !hasEndYear) {
            return this.createError({
                path: `${this.path}.endYear`,
                message: 'End Year is required unless Current is checked'
            });
        }

        return true;
    }
);

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
        qualifications: yup.array().of(qualificationItemSchema).nullable(),
        experiences: yup.array().of(experienceItemSchema).nullable()
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
