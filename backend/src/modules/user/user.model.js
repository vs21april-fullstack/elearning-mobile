import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Parents from "../parents/parents.model.js";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    phone: {
      type: String,
      required: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
      index: true,
    },

    profileImage: {
      type: String,
      default: null,
    },

    parents: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parents",
      default: null,
    },

    teacherProfile: {
      qualifications: [
        {
          degree: String,
          university: String,
        },
      ],
      experiences: [
        {
          title: String,
          company: String,
          startYear: Number,
          endYear: Number,
          isCurrent: Boolean,
        },
      ],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

/* STATICS */
schema.statics.findByEmailOrPhone = function (value, includePassword = false) {
  const query = this.findOne({
    $or: [{ email: value }, { phone: value }],
  });

  if (includePassword) {
    query.select('+password');
  }

  return query;
};

/* INSTANCE HELPERS */
schema.methods.isAdmin = function () {
  return this.role === "admin";
};

schema.methods.isTeacher = function () {
  return this.role === "teacher";
};

schema.methods.isStudent = function () {
  return this.role === "student";
};

schema.statics.checkDuplicate = async function ({ email, phone }) {
  return this.findOne({
    $or: [{ email }, { phone }],
  });
};

schema.statics.createStudent = async function (payload) {
  const { password, parents, email, phone, ...rest } = payload;

  const exists = await this.checkDuplicate({ email, phone });
  if (exists) {
    const field = exists.email === email ? 'email' : 'phone';
    const err = new Error(`User with this ${field} already exists`);
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const student = await this.create({
    ...rest,
    email,
    phone,
    role: "student",
    password: hashedPassword,
  });

  if (parents) {
    const parentsDoc = await Parents.createForStudent(
      student._id,
      parents,
    );

    student.parents = parentsDoc._id;
    await student.save();
  }

  return student;
};

schema.statics.createTeacher = async function (payload) {
  const { password, email, phone, teacherProfile, ...rest } = payload;

  const exists = await this.checkDuplicate({ email, phone });
  if (exists) {
    const field = exists.email === email ? 'email' : 'phone';
    const err = new Error(`User with this ${field} already exists`);
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return this.create({
    ...rest,
    email,
    phone,
    role: "teacher",
    teacherProfile,
    password: hashedPassword,
  });
};

export default mongoose.model("User", schema);
