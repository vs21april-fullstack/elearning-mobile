import mongoose from 'mongoose'
import User from './user.model.js'
import Parents from '../parents/parents.model.js'
import { success, successWithPagination } from '../../utils/response.js'
import { NotFoundError, ConflictError } from '../../utils/customErrors.js'
import { PAGINATION } from '../../utils/constants.js'
import { logger } from '../../utils/logger.js'

// Student CRUD
export const createStudent = async (req, reply) => {
  try {
    const student = await User.createStudent(req.body)
    logger.info(`Student created: ${student._id}`)

    const data = student.toObject()
    delete data.password

    return success(reply, data, 'Student created successfully', 201)
  } catch (err) {
    logger.error('Error creating student', { error: err.message })
    throw err
  }
}

export const getStudents = async (req, reply) => {
  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE
  const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT)
  const skip = (page - 1) * limit

  const [students, total] = await Promise.all([
    User.find({ role: 'student' })
      .populate('parents')
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt'),
    User.countDocuments({ role: 'student' })
  ])

  return successWithPagination(reply, students, { page, limit, total }, 'Students fetched successfully')
}

export const getStudentById = async (req, reply) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' })
    .populate('parents')
    .select('-password')

  if (!student) {
    throw new NotFoundError('Student', req.params.id)
  }

  return success(reply, student, 'Student fetched successfully', 200)
}

export const updateStudent = async (req, reply) => {
  const { password, parents, ...updateData } = req.body

  if (password) {
    const bcrypt = await import('bcrypt')
    updateData.password = await bcrypt.hash(password, 10)
  }

  // Handle parents data separately
  if (parents) {
    const existingParents = await Parents.findByStudent(req.params.id)

    if (existingParents) {
      // Update existing parents document
      await Parents.findOneAndUpdate(
        { student: req.params.id },
        parents,
        { new: true, runValidators: true }
      )
    } else {
      // Create new parents document
      const parentsDoc = await Parents.createForStudent(req.params.id, parents)
      updateData.parents = parentsDoc._id
    }
  }

  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'student' },
    updateData,
    { new: true, runValidators: true }
  ).select('-password')

  if (!student) {
    throw new NotFoundError('Student', req.params.id)
  }

  logger.info(`Student updated: ${student._id}`)
  return success(reply, student, 'Student updated successfully', 200)
}

export const deleteStudent = async (req, reply) => {
  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'student' },
    { isActive: false },
    { new: true }
  )

  if (!student) {
    throw new NotFoundError('Student', req.params.id)
  }

  logger.info(`Student deleted: ${student._id}`)
  return success(reply, student, 'Student deleted successfully', 200)
}

// Teacher CRUD
export const createTeacher = async (req, reply) => {
  try {
    const teacher = await User.createTeacher(req.body)
    logger.info(`Teacher created: ${teacher._id}`)

    const data = teacher.toObject()
    delete data.password

    return success(reply, data, 'Teacher created successfully', 201)
  } catch (err) {
    logger.error('Error creating teacher', { error: err.message })
    throw err
  }
}

export const getTeachers = async (req, reply) => {
  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE
  const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT)
  const skip = (page - 1) * limit

  const [teachers, total] = await Promise.all([
    User.find({ role: 'teacher' })
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt'),
    User.countDocuments({ role: 'teacher' })
  ])

  return successWithPagination(reply, teachers, { page, limit, total }, 'Teachers fetched successfully')
}

export const getTeacherById = async (req, reply) => {
  const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' })
    .select('-password')

  if (!teacher) {
    throw new NotFoundError('Teacher', req.params.id)
  }

  return success(reply, teacher, 'Teacher fetched successfully', 200)
}

export const updateTeacher = async (req, reply) => {
  const { password, parents, ...updateData } = req.body

  if (password) {
    const bcrypt = await import('bcrypt')
    updateData.password = await bcrypt.hash(password, 10)
  }

  const teacher = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'teacher' },
    updateData,
    { new: true, runValidators: true }
  ).select('-password')

  if (!teacher) {
    throw new NotFoundError('Teacher', req.params.id)
  }

  logger.info(`Teacher updated: ${teacher._id}`)
  return success(reply, teacher, 'Teacher updated successfully', 200)
}

export const deleteTeacher = async (req, reply) => {
  const teacher = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'teacher' },
    { isActive: false },
    { new: true }
  )

  if (!teacher) {
    throw new NotFoundError('Teacher', req.params.id)
  }

  logger.info(`Teacher deleted: ${teacher._id}`)
  return success(reply, teacher, 'Teacher deleted successfully', 200)
}