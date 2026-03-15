import mongoose from 'mongoose'

const schema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            index: true
        },

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        teachers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],

        isActive: {
            type: Boolean,
            default: true
        },

        thumbnail: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
)

schema.index({ title: 'text', description: 'text' })
schema.index({ teachers: 1 })

export default mongoose.model('Course', schema)
