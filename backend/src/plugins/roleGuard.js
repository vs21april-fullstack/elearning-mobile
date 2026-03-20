import User from '../modules/user/user.model.js'

export const roleGuard = (roles) => {
  return async (req, reply) => {
    await req.jwtVerify()

    const user = await User.findById(req.user.id).select('_id role isActive')
    if (!user || !user.isActive) {
      return reply.code(403).send({ message: 'Account is deactivated' })
    }

    if (!roles.includes(user.role)) {
      return reply.code(403).send({ message: 'Forbidden' })
    }

    req.user.role = user.role
  }
}