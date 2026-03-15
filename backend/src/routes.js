import auth from './modules/auth/auth.routes.js'
import users from './modules/user/user.routes.js'
import courses from './modules/course/course.routes.js'
import meetings from './modules/meeting/meeting.routes.js'
import attendance from './modules/attendance/attendance.routes.js'
import upload from './modules/upload/upload.routes.js'
import profile from './modules/profile/profile.routes.js'
import dashboard from './modules/dashboard/dashboard.routes.js'

export default async function (app) {
  app.register(auth, { prefix: '/auth' })
  app.register(users, { prefix: '/users' })
  app.register(courses, { prefix: '/courses' })
  app.register(meetings, { prefix: '/meetings' })
  app.register(attendance, { prefix: '/attendance' })
  app.register(upload, { prefix: '/upload' })
  app.register(profile, { prefix: '/profile' })
  app.register(dashboard, { prefix: '/dashboard' })
}