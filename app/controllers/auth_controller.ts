import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'

export default class AuthController {
  /**
   * Registrar un nuevo usuario
   */
  async register({ request, response }: HttpContext) {
    try {
      // Validar los datos de entrada
      const payload = await request.validateUsing(registerValidator)

      // Crear el usuario
      const user = await User.create({
        email: payload.email,
        password: payload.password,
        esAnfitrion: payload.esAnfitrion || false,
        esTramposo: payload.esTramposo || false,
        juegoId: payload.juegoId ?? undefined,
      })

      // Crear token de acceso
      const token = await User.accessTokens.create(user)

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
      // Validar los datos de entrada
      const payload = await request.validateUsing(loginValidator)

      // Buscar el usuario por email
      const user = await User.verifyCredentials(payload.email, payload.password)

      // Crear token de acceso
      const token = await User.accessTokens.create(user)

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

      // Revocar el token actual
      const token = auth.user?.currentAccessToken
      if (token) {
        await User.accessTokens.delete(user, token.identifier)
      }

      return response.json({
        message: 'Sesión cerrada exitosamente',
      })
    } catch (error) {
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

      await user.load('juego')

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
      return response.status(401).json({
        message: 'Usuario no autenticado',
        error: error.message,
      })
    }
  }
}