import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher
} from "./user.controller.js";

import {
  createStudentSchema,
  createTeacherSchema,
  updateUserSchema
} from "./user.validation.js";

import { validate } from "../../utils/validate.js";
import { roleGuard } from "../../plugins/roleGuard.js";

export default async function (app) {
  // Student routes
  app.post(
    "/students",
    {
      preHandler: [roleGuard(["admin"]), validate(createStudentSchema)],
    },
    createStudent,
  );

  app.get(
    "/students",
    {
      preHandler: roleGuard(["admin", "teacher"]),
    },
    getStudents,
  );

  app.get(
    "/student/:id",
    {
      preHandler: roleGuard(["admin", "teacher"]),
    },
    getStudentById,
  );

  app.put(
    "/student/:id",
    {
      preHandler: [roleGuard(["admin"]), validate(updateUserSchema)],
    },
    updateStudent,
  );

  app.delete(
    "/student/:id",
    {
      preHandler: roleGuard(["admin"]),
    },
    deleteStudent,
  );

  // Teacher routes
  app.post(
    "/teachers",
    {
      preHandler: [roleGuard(["admin"]), validate(createTeacherSchema)],
    },
    createTeacher,
  );

  app.get(
    "/teachers",
    {
      preHandler: roleGuard(["admin"]),
    },
    getTeachers,
  );

  app.get(
    "/teacher/:id",
    {
      preHandler: roleGuard(["admin"]),
    },
    getTeacherById,
  );

  app.put(
    "/teacher/:id",
    {
      preHandler: [roleGuard(["admin"]), validate(updateUserSchema)],
    },
    updateTeacher,
  );

  app.delete(
    "/teacher/:id",
    {
      preHandler: roleGuard(["admin"]),
    },
    deleteTeacher,
  );
}
