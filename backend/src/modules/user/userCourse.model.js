import mongoose from 'mongoose'

/**
 * UserCourse Model - Junction table for User-Course relationships
 * 
 * Current Behavior: One active course per student
 * Future Scalability: Set allowMultiple=true in enrollStudent() to enable multiple courses
 * 
 * The model is designed to support multiple course enrollments.
 * The unique compound index prevents duplicate enrollments in the same course.
 */

const schema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true
        },

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },

        enrolledAt: {
            type: Date,
            default: Date.now
        },

        completedAt: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ['enrolled', 'in-progress', 'completed', 'dropped'],
            default: 'enrolled'
        },

        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        grade: {
            type: String,
            enum: ['A', 'B', 'C', 'D', 'F', null],
            default: null
        },

        score: {
            type: Number,
            default: null,
            min: 0,
            max: 100
        }
    },
    { timestamps: true }
)

// Compound index to ensure a user can only enroll in a course once
schema.index({ user: 1, course: 1 }, { unique: true })

// Static methods
schema.statics.enrollStudent = async function (userId, courseId, teacherId = null, skipActiveCheck = false) {
    const Course = mongoose.model('Course')
    const course = await Course.findOne({ _id: courseId, isActive: true }).select('teacher teachers')

    if (!course) {
        const err = new Error('Course not found')
        err.statusCode = 404
        throw err
    }

    const primaryTeacherId = course.teacher || (Array.isArray(course.teachers) ? course.teachers[0] : null)
    const resolvedTeacherId = teacherId || primaryTeacherId || null

    const isTeacherAssigned = !!teacherId && (
        String(course.teacher || '') === String(teacherId) ||
        (Array.isArray(course.teachers) && course.teachers.some((id) => String(id) === String(teacherId)))
    )

    if (teacherId && !isTeacherAssigned) {
        const err = new Error('Selected teacher is not assigned to this course')
        err.statusCode = 400
        throw err
    }

    // Check if already enrolled in this course
    const existing = await this.findOne({ user: userId, course: courseId })
    if (existing) {
        // If already enrolled but dropped, reactivate
        if (existing.status === 'dropped') {
            existing.status = 'enrolled'
            existing.teacher = resolvedTeacherId
            return existing.save()
        }
        const err = new Error('Student already enrolled in this course')
        err.statusCode = 409
        throw err
    }

    // Note: Removed single active course restriction
    // Students can now be enrolled in multiple courses simultaneously
    return this.create({ user: userId, course: courseId, teacher: resolvedTeacherId, status: 'enrolled' })
}

// Enroll student in all courses of a class
schema.statics.enrollStudentInClassCourses = async function (userId, classId) {
    const Course = mongoose.model('Course')
    const courses = await Course.find({ class: classId, isActive: true }).select('_id')

    const enrollments = []
    for (const course of courses) {
        try {
            const enrollment = await this.enrollStudent(userId, course._id, null, true)
            enrollments.push(enrollment)
        } catch (err) {
            // Skip if already enrolled
            if (err.statusCode !== 409) {
                throw err
            }
        }
    }

    return enrollments
}

schema.statics.getStudentCourses = function (userId) {
    return this.find({ user: userId })
        .populate('course')
        .populate('teacher', 'name email')
        .sort('-enrolledAt')
}

schema.statics.getCourseStudents = function (courseId) {
    return this.find({ course: courseId })
        .populate('user')
        .sort('-enrolledAt')
}

schema.statics.updateProgress = async function (userId, courseId, progress) {
    const enrollment = await this.findOne({ user: userId, course: courseId })
    if (!enrollment) {
        const err = new Error('Enrollment not found')
        err.statusCode = 404
        throw err
    }

    enrollment.progress = progress
    if (progress === 100 && !enrollment.completedAt) {
        enrollment.completedAt = new Date()
        enrollment.status = 'completed'
    }

    return enrollment.save()
}

export default mongoose.model('UserCourse', schema)
