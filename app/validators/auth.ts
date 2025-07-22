import vine from '@vinejs/vine'

/**
 * Validador para el registro de usuarios
 */
export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email().unique(async (db, value) => {
      const user = await db.from('users').where('email', value).first()
      return !user
    }),
    password: vine.string().minLength(6),
    esAnfitrion: vine.boolean().optional(),
    esTramposo: vine.boolean().optional(),
    juegoId: vine.number().optional(),
  })
)

/**
 * Validador para el login
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
  })
)