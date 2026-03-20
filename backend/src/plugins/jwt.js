import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import User from '../modules/user/user.model.js'

export default fp(async (app) => {
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET
  })

  app.decorate('authenticate', async (req, reply) => {
    await req.jwtVerify()

    const user = await User.findById(req.user.id).select('_id role isActive')
    if (!user || !user.isActive) {
      return reply.code(403).send({ message: 'Account is deactivated' })
    }

    req.user.role = user.role
  })
})