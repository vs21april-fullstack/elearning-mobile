import mongoose from 'mongoose'

/**
 * UserClass Model - Junction table for User-Class relationships
 * 
 * This model supports many-to-many relationships between users and classes.
 * The unique compound index prevents duplicate enrollments in the same class.
 */

const schema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            required: true,
            index: true
        },

        enrolledAt: {
            type: Date,
            default: Date.now
        },

        status: {
            type: String,
            enum: ['active', 'completed', 'dropped'],
            default: 'active'
        },

        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    { timestamps: true }
)

// Compound index to ensure a user can only be enrolled in a class once
schema.index({ user: 1, class: 1 }, { unique: true })

// Static methods
schema.statics.enrollStudent = async function (userId, classId) {
    const existing = await this.findOne({ user: userId, class: classId })
    if (existing) {
        // If already enrolled and status is active, return existing enrollment
        if (existing.status === 'active') {
            return existing
        }
        // If previously dropped, reactivate the enrollment
        existing.status = 'active'
        await existing.save()

        // Re-enroll student in all courses of this class
        const UserCourse = mongoose.model('UserCourse')
        try {
            await UserCourse.enrollStudentInClassCourses(userId, classId)
        } catch (err) {
            console.error('Error auto-enrolling in class courses:', err)
        }

        return existing
    }

    const enrollment = await this.create({ user: userId, class: classId })

    // Auto-enroll student in all courses of this class
    const UserCourse = mongoose.model('UserCourse')
    try {
        await UserCourse.enrollStudentInClassCourses(userId, classId)
    } catch (err) {
        // Log error but don't fail the class enrollment
        console.error('Error auto-enrolling in class courses:', err)
    }

    return enrollment
}

schema.statics.getStudentClasses = function (userId) {
    return this.find({ user: userId, status: 'active' })
        .populate('class')
        .sort('-enrolledAt')
}

schema.statics.getClassStudents = function (classId) {
    return this.find({ class: classId, status: 'active' })
        .populate('user')
        .sort('-enrolledAt')
}

export default mongoose.model('UserClass', schema)
