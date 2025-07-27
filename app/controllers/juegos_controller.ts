import type { HttpContext } from '@adonisjs/core/http'
import Juego from '#models/juego'
import User from '#models/user'
import Carta from '#models/carta'
import Ficha from '#models/ficha'
import MazoCarta from '#models/mazo_carta'
import { generarCartillaAleatoria } from '#utils/loteria_helpers'

export default class JuegoController {
  /**
   * Crear una nueva partida
   */
  async crearPartida({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Verificar que el usuario no esté ya en un juego
      if (user.juegoId) {
        return response.status(400).json({
          message: 'Ya estás en un juego activo',
        })
      }

      // Crear el juego
      const juego = await Juego.create({
        estado: 'esperando',
        anfitrionId: user.id,
        cartasAnunciadas: [],
      })

      // Actualizar al usuario como anfitrión
      user.juegoId = juego.id
      user.esAnfitrion = true
      await user.save()

      return response.status(201).json({
        message: 'Partida creada exitosamente',
        juego: {
          id: juego.id,
          estado: juego.estado,
          esAnfitrion: true,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error al crear la partida',
        error: error.message,
      })
    }
  }

  /**
   * Unirse a una partida
   */
  async unirsePartida({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { codigoJuego } = request.only(['codigoJuego'])

      // Verificar que el usuario no esté ya en un juego
      if (user.juegoId) {
        return response.status(400).json({
          message: 'Ya estás en un juego activo',
        })
      }

      // Buscar el juego
      const juego = await Juego.findOrFail(codigoJuego)

      // Verificar que el juego esté en estado de espera
      if (juego.estado !== 'esperando') {
        return response.status(400).json({
          message: 'El juego ya ha iniciado o finalizado',
        })
      }

      // Contar jugadores actuales
      const jugadoresActuales = await User.query().where('juegoId', juego.id).count('* as total')
      const totalJugadores = Number(jugadoresActuales[0].$extras.total)

      if (totalJugadores >= 16) {
        return response.status(400).json({
          message: 'El juego está lleno (máximo 16 jugadores)',
        })
      }

      // Unir al usuario al juego
      user.juegoId = juego.id
      user.esAnfitrion = false
      await user.save()

      return response.json({
        message: 'Te has unido a la partida exitosamente',
        juego: {
          id: juego.id,
          estado: juego.estado,
          esAnfitrion: false,
          totalJugadores: totalJugadores + 1,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error al unirse a la partida',
        error: error.message,
      })
    }
  }

  /**
   * Iniciar partida (solo anfitrión)
   */
  async iniciarPartida({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      if (!user.esAnfitrion) {
        return response.status(403).json({
          message: 'Solo el anfitrión puede iniciar la partida',
        })
      }

      const juego = await Juego.findOrFail(user.juegoId!)

      // Contar jugadores
      const jugadores = await User.query().where('juegoId', juego.id)
      const totalJugadores = jugadores.length

      if (totalJugadores < 4) {
        return response.status(400).json({
          message: 'Se necesitan mínimo 4 jugadores para iniciar',
        })
      }

      // Generar cartillas para todos los jugadores
      for (const jugador of jugadores) {
        // Verificar si ya tiene cartilla
        const cartillaExistente = await Carta.query()
          .where('usuarioId', jugador.id)
          .where('juegoId', juego.id)
          .first()

        if (!cartillaExistente) {
          const cartillaIds = await generarCartillaAleatoria()
          await Carta.create({
            juegoId: juego.id,
            usuarioId: jugador.id,
            mazoCartaIds: cartillaIds,
            estaRevelada: false,
          })
        }
      }

      // Cambiar estado del juego
      juego.estado = 'iniciado'
      await juego.save()

      return response.json({
        message: 'Partida iniciada exitosamente',
        juego: {
          id: juego.id,
          estado: juego.estado,
          totalJugadores,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error al iniciar la partida',
        error: error.message,
      })
    }
  }

  /**
   * Revelar siguiente carta (solo anfitrión)
   */
  async revelarCarta({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      if (!user.esAnfitrion) {
        return response.status(403).json({
          message: 'Solo el anfitrión puede revelar cartas',
        })
      }

      const juego = await Juego.findOrFail(user.juegoId!)

      if (juego.estado !== 'iniciado') {
        return response.status(400).json({
          message: 'El juego no está en estado de juego',
        })
      }

      const cartasAnunciadas = juego.cartasAnunciadas

      // Obtener cartas no anunciadas
      const todasLasCartas = await MazoCarta.query().select('id')
      const cartasNoAnunciadas = todasLasCartas.filter(
        (carta) => !cartasAnunciadas.includes(carta.id)
      )

      if (cartasNoAnunciadas.length === 0) {
        return response.status(400).json({
          message: 'Ya se han revelado todas las cartas',
        })
      }

      // Seleccionar una carta aleatoria de las no anunciadas
      const cartaRevelada =
        cartasNoAnunciadas[Math.floor(Math.random() * cartasNoAnunciadas.length)]
      const cartaInfo = await MazoCarta.findOrFail(cartaRevelada.id)

      // Agregar a cartas anunciadas
      cartasAnunciadas.push(cartaRevelada.id)

      // Actualizar juego
      juego.cartasAnunciadas = cartasAnunciadas
      await juego.save()

      return response.json({
        message: 'Carta revelada',
        carta: {
          id: cartaInfo.id,
          numero: cartaInfo.numero,
          nombre: cartaInfo.nombre,
          imagen: cartaInfo.imagen,
        },
        totalCartasReveladas: cartasAnunciadas.length,
        totalCartas: todasLasCartas.length,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error al revelar carta',
        error: error.message,
      })
    }
  }

  /**
   * Marcar ficha en cartilla
   */
  async marcarFicha({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { posicion } = request.only(['posicion']) // Posición 0-15 en la cartilla

      if (posicion < 0 || posicion > 15) {
        return response.status(400).json({
          message: 'Posición inválida',
        })
      }

      const juego = await Juego.findOrFail(user.juegoId!)

      if (juego.estado !== 'iniciado') {
        return response.status(400).json({
          message: 'El juego no está activo',
        })
      }

      // Obtener la cartilla del usuario
      const carta = await Carta.query()
        .where('usuarioId', user.id)
        .where('juegoId', juego.id)
        .firstOrFail()

      const cartasCartilla = carta.mazoCartaIds
      const cartasAnunciadas = juego.cartasAnunciadas

      // Verificar si la carta en esa posición ha sido anunciada
      const cartaEnPosicion = cartasCartilla[posicion]

      if (!cartasAnunciadas.includes(cartaEnPosicion)) {
        // Marcar como tramposo
        user.esTramposo = true
        await user.save()

        return response.status(400).json({
          message: 'Carta no válida - marcado como tramposo',
          esTramposo: true,
        })
      }

      // Verificar si ya existe la ficha
      const fichaExistente = await Ficha.query()
        .where('cartaId', carta.id)
        .where('posicion', posicion)
        .first()

      if (fichaExistente) {
        return response.status(400).json({
          message: 'La ficha ya está marcada',
        })
      }

      // Crear la ficha
      await Ficha.create({
        cartaId: carta.id,
        posicion: posicion,
      })

      // Contar fichas totales del usuario
      const totalFichas = await Ficha.query().where('cartaId', carta.id).count('* as total')
      const fichasCount = Number(totalFichas[0].$extras.total)

      // Verificar si completó la cartilla
      if (fichasCount === 16 && !user.esTramposo) {
        // ¡Ganador!
        juego.ganadorId = user.id
        juego.estado = 'finalizado'
        await juego.save()

        return response.json({
          message: '¡Felicidades! Has ganado',
          ganador: true,
          totalFichas: fichasCount,
        })
      }

      return response.json({
        message: 'Ficha marcada correctamente',
        totalFichas: fichasCount,
        cartillaCompleta: fichasCount === 16,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error al marcar ficha',
        error: error.message,
      })
    }
  }

  /**
   * Obtener estado actual del juego
   */
  async obtenerEstadoJuego({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      if (!user.juegoId) {
        return response.status(400).json({
          message: 'No estás en ningún juego',
        })
      }

      const juego = await Juego.query().where('id', user.juegoId).preload('jugadores').firstOrFail()

      // Obtener cartilla del usuario
      const carta = await Carta.query()
        .where('usuarioId', user.id)
        .where('juegoId', juego.id)
        .preload('fichas')
        .first()

      let cartillaData = null
      if (carta) {
        const cartasIds = carta.mazoCartaIds
        const cartasInfo = await MazoCarta.query().whereIn('id', cartasIds)

        // Crear array de fichas marcadas (boolean array)
        const fichasMarcadas = Array(16).fill(false)
        carta.fichas.forEach((ficha) => {
          fichasMarcadas[ficha.posicion] = true
        })

        cartillaData = {
          cartas: cartasInfo,
          fichas: fichasMarcadas,
        }
      }

      // Información de la carta actual (última anunciada)
      let cartaActualInfo = null
      const cartasAnunciadas = juego.cartasAnunciadas
      if (cartasAnunciadas.length > 0) {
        const ultimaCartaId = cartasAnunciadas[cartasAnunciadas.length - 1]
        cartaActualInfo = await MazoCarta.find(ultimaCartaId)
      }

      return response.json({
        juego: {
          id: juego.id,
          estado: juego.estado,
          cartaActual: cartaActualInfo,
          totalCartasAnunciadas: cartasAnunciadas.length,
          ganadorId: juego.ganadorId,
          totalJugadores: juego.jugadores.length,
          cartasAnunciadas: cartasAnunciadas,
        },
        usuario: {
          esAnfitrion: user.esAnfitrion,
          esTramposo: user.esTramposo,
        },
        cartilla: cartillaData,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error al obtener estado del juego',
        error: error.message,
      })
    }
  }

  /**
   * Ver cartillas de todos los jugadores (solo anfitrión)
   */
  async verCartillasJugadores({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      if (!user.esAnfitrion) {
        return response.status(403).json({
          message: 'Solo el anfitrión puede ver las cartillas',
        })
      }

      const juego = await Juego.findOrFail(user.juegoId!)
      const jugadores = await User.query()
        .where('juegoId', juego.id)
        .preload('carta', (cartaQuery) => {
          cartaQuery.preload('fichas')
        })

      const cartillasJugadores = await Promise.all(
        jugadores.map(async (jugador) => {
          if (!jugador.carta) {
            return {
              jugador: {
                id: jugador.id,
                email: jugador.email,
                esTramposo: jugador.esTramposo,
              },
              cartilla: null,
            }
          }

          const cartasIds = jugador.carta.mazoCartaIds
          const cartasInfo = await MazoCarta.query().whereIn('id', cartasIds)

          // Crear array de fichas marcadas
          const fichasMarcadas = Array(16).fill(false)
          jugador.carta.fichas.forEach((ficha) => {
            fichasMarcadas[ficha.posicion] = true
          })

          return {
            jugador: {
              id: jugador.id,
              email: jugador.email,
              esTramposo: jugador.esTramposo,
            },
            cartilla: {
              cartas: cartasInfo,
              fichas: fichasMarcadas,
            },
          }
        })
      )

      return response.json({
        cartillas: cartillasJugadores,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error al obtener cartillas',
        error: error.message,
      })
    }
  }

  /**
   * Salir del juego
   */
  async salirJuego({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      if (!user.juegoId) {
        return response.status(400).json({
          message: 'No estás en ningún juego',
        })
      }

      const juegoId = user.juegoId

      // Eliminar cartilla y fichas si existen
      const carta = await Carta.query()
        .where('usuarioId', user.id)
        .where('juegoId', juegoId)
        .first()

      if (carta) {
        await Ficha.query().where('cartaId', carta.id).delete()
        await carta.delete()
      }

      // Remover del juego
      user.juegoId = null
      user.esAnfitrion = false
      user.esTramposo = false
      await user.save()

      // Si era el anfitrión y hay otros jugadores, asignar nuevo anfitrión
      const jugadoresRestantes = await User.query().where('juegoId', juegoId)

      if (jugadoresRestantes.length > 0) {
        const nuevoAnfitrion = jugadoresRestantes[0]
        nuevoAnfitrion.esAnfitrion = true
        await nuevoAnfitrion.save()
      } else {
        // Si no quedan jugadores, eliminar el juego
        await Juego.query().where('id', juegoId).delete()
      }

      return response.json({
        message: 'Has salido del juego exitosamente',
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error al salir del juego',
        error: error.message,
      })
    }
  }
}
