import vine from '@vinejs/vine'

export const crearPartidaValidator = vine.compile(
  vine.object({
    maxJugadores: vine.number().min(4).max(16),
  })
)
