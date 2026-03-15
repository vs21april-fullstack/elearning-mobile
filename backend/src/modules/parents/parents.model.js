import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    father: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      occupation: {
        type: String,
        trim: true
      }
    },

    mother: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      occupation: {
        type: String,
        trim: true
      }
    },

    address: {
      type: String,
      trim: true
    },

    emergencyContact: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      relation: {
        type: String,
        trim: true
      }
    }
  },
  { timestamps: true }
)


schema.statics.createForStudent = async function (
  studentId,
  parentsPayload
) {
  return this.create({
    student: studentId,
    ...parentsPayload
  })
}


schema.statics.findByStudent = function (studentId) {
  return this.findOne({ student: studentId })
}

export default mongoose.model('Parents', schema)