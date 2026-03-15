import * as yup from 'yup'


export const createStudentSchema = yup.object({
  name: yup.string().required(),
  phone: yup.string().required(),
  password: yup.string().min(6).required(),

  parents: yup.object({
    father: yup.object({
      name: yup.string().nullable(),
      phone: yup.string().nullable()
    }).nullable(),

    mother: yup.object({
      name: yup.string().nullable(),
      phone: yup.string().nullable()
    }).nullable()
  }).nullable()
})

export const createUserSchema = yup.object({
  name: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
  role: yup.string().oneOf(['admin', 'teacher', 'student']).required()
})

export const createTeacherSchema = yup.object({
  name: yup.string().required(),
  phone: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),

  teacherProfile: yup.object({
    qualifications: yup.array().of(
      yup.object({
        degree: yup.string().required(),
        university: yup.string().required()
      })
    ).required(),
    experiences: yup.array().of(
      yup.object({
        title: yup.string().required(),
        company: yup.string().required(),
        startYear: yup.number().required(),
        endYear: yup.number().nullable(),
        isCurrent: yup.boolean()
      })
    ).required()
  }).required()
})

export const updateUserSchema = yup.object({
  name: yup.string(),
  phone: yup.string(),
  email: yup.string().email(),
  password: yup.string().min(6),
  profileImage: yup.string(),
  isActive: yup.boolean(),
  teacherProfile: yup.object({
    qualifications: yup.array().of(
      yup.object({
        degree: yup.string(),
        university: yup.string()
      })
    ),
    experiences: yup.array().of(
      yup.object({
        title: yup.string(),
        company: yup.string(),
        startYear: yup.number(),
        endYear: yup.number().nullable(),
        isCurrent: yup.boolean()
      })
    )
  }),
  parents: yup.object({
    father: yup.object({
      name: yup.string().nullable(),
      phone: yup.string().nullable()
    }).nullable(),
    mother: yup.object({
      name: yup.string().nullable(),
      phone: yup.string().nullable()
    }).nullable()
  }).nullable()
})