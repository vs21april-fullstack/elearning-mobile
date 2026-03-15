import mongoose from 'mongoose'

/**
 * Meeting Model
 * Represents scheduled online meetings for classes/courses
 */

const schema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            index: true
        },

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            index: true
        },

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        date: {
            type: Date,
            required: true,
            index: true
        },

        startTime: {
            type: String,
            required: true
        },

        endTime: {
            type: String,
            required: true
        },

        meetingLink: {
            type: String
        },

        status: {
            type: String,
            enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
            default: 'scheduled',
            index: true
        },

        notes: {
            type: String,
            trim: true
        },

        isActive: {
            type: Boolean,
            default: true
        },

        presenceEvents: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                role: {
                    type: String,
                    enum: ['admin', 'teacher', 'student'],
                    required: true
                },
                event: {
                    type: String,
                    enum: ['join', 'leave'],
                    required: true
                },
                occurredAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    { timestamps: true }
)

// Compound index for efficient queries
schema.index({ class: 1, date: 1 })
schema.index({ teacher: 1, date: 1 })
schema.index({ course: 1, date: 1 })

export default mongoose.model('Meeting', schema)
