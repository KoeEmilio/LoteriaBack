import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'
import logger from '@adonisjs/core/services/logger'

export default class AuthController {
  /**
   * Registrar un nuevo usuario
   */
  async register({ request, response }: HttpContext) {
    try {
      logger.info('Received register request: %o', request.all())
      // Validar los datos de entrada
      const payload = await request.validateUsing(registerValidator)
      logger.info('Validated payload: %o', payload)

      // Crear el usuario
      const user = await User.create({
        email: payload.email,
        password: payload.password,
        esAnfitrion: payload.esAnfitrion || false,
        esTramposo: payload.esTramposo || false,
        juegoId: payload.juegoId ?? undefined,
      })
      logger.info('User created: %o', user)

      // Crear token de acceso
      const token = await User.accessTokens.create(user)
      logger.info('Token created for user ID: %s', user.id)

      return response.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          esAnfitrion: user.esAnfitrion,
          esTramposo: user.esTramposo,
          juegoId: user.juegoId,
        },
        token: {
          type: 'Bearer',
          value: token.value!.release(),
        },
      })
    } catch (error) {
      logger.error('Registration error: %o', error)
      return response.status(400).json({
        message: 'Error al registrar usuario',
        errors: error.messages || error.message,
      })
    }
  }

  /**
   * Iniciar sesión
   */
  async login({ request, response }: HttpContext) {
    try {
      logger.info('Received login request: %o', request.all())
      // Validar los datos de entrada
      const payload = await request.validateUsing(loginValidator)
      logger.info('Validated login payload: %o', payload)

      // Buscar el usuario por email
      const user = await User.verifyCredentials(payload.email, payload.password)
      logger.info('User authenticated: %o', user)

      // Crear token de acceso
      const token = await User.accessTokens.create(user)
      logger.info('Token created for login: %s', user.id)

      return response.json({
        message: 'Inicio de sesión exitoso',
        user: {
          id: user.id,
          email: user.email,
          esAnfitrion: user.esAnfitrion,
          esTramposo: user.esTramposo,
          juegoId: user.juegoId,
        },
        token: {
          type: 'Bearer',
          value: token.value!.release(),
        },
      })
    } catch (error) {
      logger.error('Login error: %o', error)
      return response.status(401).json({
        message: 'Credenciales inválidas',
        error: error.message,
      })
    }
  }

  /**
   * Cerrar sesión
   */
  async logout({ auth, response }: HttpContext) {
    try {
      // Obtener el usuario autenticado
      const user = auth.getUserOrFail()
      logger.info('Logout attempt for user ID: %s', user.id)

      // Revocar el token actual
      const token = auth.user?.currentAccessToken
      if (token) {
        await User.accessTokens.delete(user, token.identifier)
        logger.info('Token revoked for user ID: %s', user.id)
      }

      return response.json({
        message: 'Sesión cerrada exitosamente',
      })
    } catch (error) {
      logger.error('Logout error: %o', error)
      return response.status(401).json({
        message: 'Error al cerrar sesión',
        error: error.message,
      })
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async me({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      logger.info('Fetching profile for user ID: %s', user.id)

      await user.load('juego')
      logger.info('User profile loaded: %o', user)

      return response.json({
        user: {
          id: user.id,
          email: user.email,
          esAnfitrion: user.esAnfitrion,
          esTramposo: user.esTramposo,
          juegoId: user.juegoId,
          juego: user.juego,
          creadoEn: user.creadoEn,
          actualizadoEn: user.actualizadoEn,
        },
      })
    } catch (error) {
      logger.error('Profile fetch error: %o', error)
      return response.status(401).json({
        message: 'Usuario no autenticado',
        error: error.message,
      })
    }
  }
}
