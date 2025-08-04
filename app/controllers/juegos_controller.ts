import type { HttpContext } from '@adonisjs/core/http';
import Juego from '#models/juego';
import User from '#models/user';
import Carta from '#models/carta';
import Ficha from '#models/ficha';
import MazoCarta from '#models/mazo_carta';
import { generarCartillaAleatoria } from '#utils/loteria_helpers';
import { crearPartidaValidator } from '#validators/juego';
import logger from '@adonisjs/core/services/logger';

export default class JuegoController {
  async crearPartida({ auth, request, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail();
      logger.info('Usuario autenticado para crear partida: %o', { id: user.id, email: user.email });

      if (user.juegoId) {
        logger.info('El usuario ya está en un juego: %o', { id: user.id, juegoId: user.juegoId });
        return response.status(400).json({
          message: 'Ya estás en un juego activo',
        });
      }

      const { maxJugadores } = await request.validateUsing(crearPartidaValidator);
      logger.info('Datos validados: maxJugadores=%d', maxJugadores);

      const userExists = await User.find(user.id);
      if (!userExists) {
        logger.error('Usuario no encontrado en la base de datos: %d', user.id);
        return response.status(400).json({
          message: 'Usuario no válido',
        });
      }

      const juego = await Juego.create({
        estado: 'esperando',
        anfitrionId: user.id,
        maxJugadores,
        cartasAnunciadas: [],
        tramposos: [],
        confirmacionesRevancha: [],
      });
      logger.info('Juego creado: %o', {
        id: juego.id,
        estado: juego.estado,
        anfitrionId: juego.anfitrionId,
        maxJugadores: juego.maxJugadores,
        confirmacionesRevancha: juego.confirmacionesRevancha,
      });

      user.juegoId = juego.id;
      user.esAnfitrion = true;
      await user.save();
      logger.info('Usuario actualizado como anfitrión: %o', { id: user.id, juegoId: user.juegoId });

      return response.status(201).json({
        message: 'Partida creada exitosamente',
        juego: {
          id: juego.id,
          estado: juego.estado,
          maxJugadores: juego.maxJugadores,
          esAnfitrion: true,
          totalJugadores: 1,
        },
      });
    } catch (error) {
      logger.error('Error al crear la partida: %o', {
        message: error.message,
        stack: error.stack,
        sql: error.sql,
        sqlMessage: error.sqlMessage,
      });
      return response.status(500).json({
        message: 'Error al crear la partida',
        error: error.sqlMessage || error.message || 'Error interno del servidor',
      });
    }
  }

  async unirsePartida({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      if (user.juegoId) {
        // Check if the referenced game exists and is active
        const currentJuego = await Juego.find(user.juegoId);
        if (!currentJuego || currentJuego.estado === 'finalizado') {
          logger.info('Usuario %d tiene juegoId %d pero el juego no existe o está finalizado, limpiando juegoId', user.id, user.juegoId);
          user.juegoId = null;
          user.esAnfitrion = false;
          user.esTramposo = false;
          await user.save();
        } else {
          logger.info('El usuario ya está en un juego activo: %o', user);
          return response.status(400).json({
            message: 'Ya estás en un juego activo',
          });
        }
      }

      const juegoId = request.input('juegoId');
      if (!juegoId) {
        return response.status(400).json({
          message: 'ID de juego requerido',
        });
      }

      const juego = await Juego.query()
        .where('id', juegoId)
        .where('estado', 'esperando')
        .preload('jugadores')
        .firstOrFail();

      if (juego.jugadores.length >= juego.maxJugadores) {
        return response.status(400).json({
          message: 'El juego está lleno',
        });
      }

      user.juegoId = juego.id;
      user.esAnfitrion = false;
      await user.save();
      logger.info('Usuario unido al juego: %o', user);

      const totalJugadores = juego.jugadores.length + 1;

      return response.json({
        message: 'Te has unido a la partida exitosamente',
        juego: {
          id: juego.id,
          estado: juego.estado,
          maxJugadores: juego.maxJugadores,
          esAnfitrion: false,
          totalJugadores,
          confirmacionesRevancha: [],
        },
      });
    } catch (error) {
      logger.error('Error al unirse a la partida: %o', error);
      return response.status(500).json({
        message: 'Error al unirse a la partida',
        error: error.message,
      });
    }
  }

  async listarPartidas({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1);
      const limit = 10;

      const juegos = await Juego.query()
        .whereIn('estado', ['esperando', 'revancha_pendiente'])
        .preload('jugadores')
        .whereRaw(
          '(SELECT COUNT(*) FROM users WHERE users.juego_id = juegos.id) < juegos.max_jugadores'
        )
        .preload('anfitrion')
        .paginate(page, limit);

      const juegosFormateados = juegos.toJSON().data.map((juego) => ({
        id: juego.id,
        anfitrionEmail: juego.anfitrion?.email || 'Desconocido',
        maxJugadores: juego.maxJugadores,
        totalJugadores: juego.jugadores.length,
        creadoEn: juego.creadoEn,
      }));

      return response.json({
        message: 'Lista de partidas disponibles',
        partidas: juegosFormateados,
        meta: juegos.toJSON().meta,
      });
    } catch (error) {
      logger.error('Error al listar partidas: %o', error);
      return response.status(500).json({
        message: 'Error al listar partidas',
        error: error.message,
      });
    }
  }

  async iniciarPartida({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail();

      if (!user.esAnfitrion) {
        return response.status(403).json({
          message: 'Solo el anfitrión puede iniciar la partida',
        });
      }

      const juego = await Juego.findOrFail(user.juegoId!);

      if (juego.estado !== 'esperando' && juego.estado !== 'revancha_pendiente') {
        return response.status(400).json({
          message: 'El juego no está en estado de espera o revancha pendiente',
        });
      }

      let jugadores = await User.query().where('juegoId', juego.id);
      if (juego.estado === 'revancha_pendiente') {
        const confirmacionesRevancha = juego.confirmacionesRevancha || [];
        jugadores = jugadores.filter(j => confirmacionesRevancha.includes(j.id));
        const unconfirmedPlayers = await User.query()
          .where('juegoId', juego.id)
          .whereNotIn('id', confirmacionesRevancha);
        for (const player of unconfirmedPlayers) {
          const carta = await Carta.query()
            .where('usuarioId', player.id)
            .where('juegoId', juego.id)
            .first();
          if (carta) {
            await Ficha.query().where('cartaId', carta.id).delete();
            await carta.delete();
          }
          player.juegoId = null;
          player.esTramposo = false;
          await player.save();
          logger.info('Usuario %d removido por no confirmar revancha', player.id);
        }
      }

      const totalJugadores = jugadores.length;
      if (totalJugadores < 4) {
        return response.status(400).json({
          message: 'Se necesitan mínimo 4 jugadores para iniciar',
        });
      }

      if (juego.estado === 'revancha_pendiente') {
        for (const jugador of jugadores) {
          const oldCarta = await Carta.query()
            .where('usuarioId', jugador.id)
            .where('juegoId', juego.id)
            .first();
          if (oldCarta) {
            await Ficha.query().where('cartaId', oldCarta.id).delete();
            await oldCarta.delete();
            logger.info('Carta antigua eliminada para usuario %d en juego %d', jugador.id, juego.id);
          }
        }
      }

      for (const jugador of jugadores) {
        const cartillaIds = await generarCartillaAleatoria();
        logger.info(`Creando cartilla para el usuario ${jugador.id}: %o`, cartillaIds);
        await Carta.create({
          juegoId: juego.id,
          usuarioId: jugador.id,
          mazoCartaIds: cartillaIds,
          estaRevelada: false,
        });
      }

      juego.estado = 'iniciado';
      juego.confirmacionesRevancha = [];
      juego.cartasAnunciadas = [];
      juego.ganadorId = null;
      await juego.save();
      logger.info('Juego %d iniciado, estado: %s, confirmacionesRevancha: %o', juego.id, juego.estado, juego.confirmacionesRevancha);

      return response.json({
        message: 'Partida iniciada exitosamente',
        juego: {
          id: juego.id,
          estado: juego.estado,
          totalJugadores,
          maxJugadores: juego.maxJugadores,
          esAnfitrion: true,
          cartasAnunciadas: [],
          tramposos: [],
          confirmacionesRevancha: [],
        },
      });
    } catch (error) {
      logger.error('Error al iniciar la partida: %o', error);
      return response.status(500).json({
        message: 'Error al iniciar la partida',
        error: error.message,
      });
    }
  }

  async revelarCarta({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail();

      if (!user.esAnfitrion) {
        return response.status(403).json({
          message: 'Solo el anfitrión puede revelar cartas',
        });
      }

      const juego = await Juego.findOrFail(user.juegoId!);

      if (juego.estado !== 'iniciado') {
        return response.status(400).json({
          message: 'El juego no está en estado de juego',
        });
      }

      const cartasAnunciadas = juego.cartasAnunciadas;
      const todasLasCartas = await MazoCarta.query().select('id');
      const cartasNoAnunciadas = todasLasCartas.filter(
        (carta) => !cartasAnunciadas.includes(carta.id)
      );

      if (cartasNoAnunciadas.length === 0) {
        return response.status(400).json({
          message: 'Ya se han revelado todas las cartas',
        });
      }

      const cartaRevelada =
        cartasNoAnunciadas[Math.floor(Math.random() * cartasNoAnunciadas.length)];
      const cartaInfo = await MazoCarta.findOrFail(cartaRevelada.id);

      cartasAnunciadas.push(cartaRevelada.id);
      juego.cartasAnunciadas = cartasAnunciadas;
      await juego.save();

      logger.info('Carta revelada: %o', {
        id: cartaInfo.id,
        numero: cartaInfo.numero,
        nombre: cartaInfo.nombre,
      });

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
      });
    } catch (error) {
      logger.error('Error al revelar carta: %o', error);
      return response.status(500).json({
        message: 'Error al revelar carta',
        error: error.message,
      });
    }
  }

  async marcarFicha({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      const { posicion } = request.only(['posicion']);
      logger.info('Marcando ficha: usuario %d, posición %d', user.id, posicion);

      if (posicion < 0 || posicion > 15) {
        return response.status(400).json({
          message: 'Posición inválida',
        });
      }

      const juego = await Juego.findOrFail(user.juegoId!);

      if (juego.estado !== 'iniciado') {
        return response.status(400).json({
          message: 'El juego no está activo',
        });
      }

      const carta = await Carta.query()
        .where('usuarioId', user.id)
        .where('juegoId', juego.id)
        .firstOrFail();

      const cartasCartilla = carta.mazoCartaIds;
      const cartasAnunciadas = juego.cartasAnunciadas;
      logger.info('Cartas anunciadas: %o', cartasAnunciadas);
      logger.info('Cartas en cartilla: %o', cartasCartilla);
      logger.info('Carta en posición %d: %d', posicion, cartasCartilla[posicion]);

      const cartaEnPosicion = cartasCartilla[posicion];

      if (!cartasAnunciadas.includes(cartaEnPosicion)) {
        logger.warn(
          'Intento de trampa detectado: Carta %d en posición %d no está en cartasAnunciadas %o',
          cartaEnPosicion,
          posicion,
          cartasAnunciadas
        );
        user.esTramposo = true;
        await user.save();
        logger.info('Usuario marcado como tramposo: %d', user.id);

        const tramposos = juego.tramposos || [];
        if (!tramposos.some((t) => t.id === user.id)) {
          tramposos.push({ id: user.id, email: user.email });
          juego.tramposos = tramposos;
          await juego.save();
          logger.info('Tramposo añadido a juego.tramposos: %o', { id: user.id, email: user.email });
        }

        const juegoId = user.juegoId;
        if (carta) {
          await Ficha.query().where('cartaId', carta.id).delete();
          await carta.delete();
          logger.info('Carta y fichas eliminadas para usuario %d en juego %d', user.id, juego.id);
        }
        user.juegoId = null;
        user.esAnfitrion = false;
        user.esTramposo = false;
        await user.save();
        logger.info('Usuario %d expulsado del juego %d, esTramposo restablecido a false', user.id, juegoId);

        if (user.id === juego.anfitrionId) {
          const jugadoresRestantes = await User.query()
            .where('juegoId', juegoId as number)
            .whereNot('id', user.id);
          if (jugadoresRestantes.length > 0) {
            const nuevoAnfitrion = jugadoresRestantes[0];
            nuevoAnfitrion.esAnfitrion = true;
            await nuevoAnfitrion.save();
            juego.anfitrionId = nuevoAnfitrion.id;
            await juego.save();
            logger.info('Nuevo anfitrión asignado: %d', nuevoAnfitrion.id);
          } else {
            await Juego.query().where('id', juegoId as number).delete();
            logger.info('Juego eliminado, no quedan jugadores');
          }
        }

        return response.status(400).json({
          message: 'Carta no válida - has sido expulsado por intentar hacer trampa',
          esTramposo: true,
          expulsado: true,
        });
      }

      const fichaExistente = await Ficha.query()
        .where('cartaId', carta.id)
        .where('posicion', posicion)
        .first();

      if (fichaExistente) {
        return response.status(400).json({
          message: 'La ficha ya está marcada',
        });
      }

      await Ficha.create({
        cartaId: carta.id,
        posicion: posicion,
      });

      const totalFichas = await Ficha.query().where('cartaId', carta.id).count('* as total');
      const fichasCount = Number(totalFichas[0].$extras.total);

      if (fichasCount === 16 && !user.esTramposo) {
        juego.ganadorId = user.id;
        juego.estado = 'finalizado';
        await juego.save();

        // Clean up all players and delete the game
        const jugadores = await User.query().where('juegoId', juego.id);
        for (const jugador of jugadores) {
          const carta = await Carta.query()
            .where('usuarioId', jugador.id)
            .where('juegoId', juego.id)
            .first();
          if (carta) {
            await Ficha.query().where('cartaId', carta.id).delete();
            await carta.delete();
            logger.info('Carta y fichas eliminadas para usuario %d en juego %d', jugador.id, juego.id);
          }
          jugador.juegoId = null;
          jugador.esAnfitrion = false;
          jugador.esTramposo = false;
          await jugador.save();
          logger.info('Usuario %d removido del juego %d, esAnfitrion: %s, esTramposo: %s', jugador.id, juego.id, jugador.esAnfitrion, jugador.esTramposo);
        }

        await Juego.query().where('id', juego.id).delete();
        logger.info('Juego terminado y eliminado: %d', juego.id);

        return response.json({
          message: '¡Felicidades! Has ganado',
          ganador: true,
          totalFichas: fichasCount,
        });
      }

      return response.json({
        message: 'Ficha marcada correctamente',
        totalFichas: fichasCount,
        cartillaCompleta: fichasCount === 16,
      });
    } catch (error) {
      logger.error('Error al marcar ficha: %o', error);
      return response.status(500).json({
        message: 'Error al marcar ficha',
        error: error.message,
      });
    }
  }

  async obtenerEstadoJuego({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail();

      if (!user.juegoId) {
        return response.status(400).json({ message: 'No estás en ningún juego' });
      }

      const juego = await Juego.query()
        .where('id', user.juegoId)
        .preload('jugadores')
        .preload('anfitrion')
        .firstOrFail();

      if (!juego.estado) {
        logger.log('warn', 'Estado inválido detectado para juego %d: %s', juego.id, juego.estado);
        if (juego.confirmacionesRevancha && juego.confirmacionesRevancha.length > 0) {
          logger.log('info', 'Corrigiendo estado a revancha_pendiente para juego %d', juego.id);
          juego.estado = 'revancha_pendiente';
          await juego.save();
        } else {
          juego.estado = juego.ganadorId ? 'finalizado' : 'esperando';
          await juego.save();
          logger.log('info', 'Corrigiendo estado a %s para juego %d', juego.estado, juego.id);
        }
      }

      const carta = await Carta.query()
        .where('usuarioId', user.id)
        .where('juegoId', juego.id)
        .preload('fichas')
        .first();

      let cartillaData = null;
      if (carta) {
        const cartasIds = carta.mazoCartaIds;
        const cartasInfo = await MazoCarta.query().whereIn('id', cartasIds);
        const sortedCartasInfo = cartasIds
          .map(id => cartasInfo.find(c => c.id === id))
          .filter(c => c !== undefined);
        logger.log('info', 'Cartas enviadas al frontend: %o', sortedCartasInfo.map(c => c.id));
        const fichasMarcadas = Array(16).fill(false);
        carta.fichas.forEach((ficha) => {
          fichasMarcadas[ficha.posicion] = true;
        });

        cartillaData = {
          cartas: sortedCartasInfo,
          fichas: fichasMarcadas,
        };
      }

      let cartaActualInfo = null;
      const cartasAnunciadas = juego.cartasAnunciadas;
      if (cartasAnunciadas.length > 0) {
        const ultimaCartaId = cartasAnunciadas[cartasAnunciadas.length - 1];
        cartaActualInfo = await MazoCarta.find(ultimaCartaId);
        logger.log('info', 'Enviando carta actual: %o', cartaActualInfo ? {
          id: cartaActualInfo.id,
          numero: cartaActualInfo.numero,
          nombre: cartaActualInfo.nombre,
        } : null);
      } else {
        logger.log('info', 'No hay cartas anunciadas aún');
      }

      let ganadorEmail: string | null = null;
      if (juego.ganadorId) {
        const ganador = await User.find(juego.ganadorId);
        ganadorEmail = ganador ? ganador.email : null;
        logger.log('info', 'Ganador encontrado: %o', { id: juego.ganadorId, email: ganadorEmail });
      }

      const confirmacionesRevancha = juego.confirmacionesRevancha || [];
      const jugadoresConfirmados = await User.query()
        .whereIn('id', confirmacionesRevancha)
        .select('id', 'email');

      const responseData = {
        message: 'Estado del juego',
        juego: {
          id: juego.id,
          estado: juego.estado,
          cartaActual: cartaActualInfo
            ? {
                id: cartaActualInfo.id,
                numero: cartaActualInfo.numero,
                nombre: cartaActualInfo.nombre,
                imagen: cartaActualInfo.imagen,
              }
            : null,
          totalCartasAnunciadas: cartasAnunciadas.length,
          ganadorId: juego.ganadorId,
          ganadorEmail: ganadorEmail,
          totalJugadores: juego.jugadores.length,
          maxJugadores: juego.maxJugadores,
          cartasAnunciadas: cartasAnunciadas,
          tramposos: juego.tramposos || [],
          confirmacionesRevancha: jugadoresConfirmados.map(u => ({ id: u.id, email: u.email })),
        },
        usuario: {
          esAnfitrion: user.id === juego.anfitrionId,
          esTramposo: user.esTramposo,
        },
        cartilla: cartillaData,
      };

      logger.log('info', 'Estado del juego enviado: %o', {
        juegoId: juego.id,
        estado: juego.estado,
        cartaActual: cartaActualInfo ? { id: cartaActualInfo.id, nombre: cartaActualInfo.nombre } : null,
        totalCartasAnunciadas: cartasAnunciadas.length,
        ganadorId: juego.ganadorId,
        ganadorEmail: ganadorEmail,
        tramposos: juego.tramposos,
        confirmacionesRevancha: confirmacionesRevancha,
        esAnfitrion: responseData.usuario.esAnfitrion,
      });

      return response.json(responseData);
    } catch (error) {
      logger.log('error', 'Error en obtener estado del juego: %o', error);
      return response.status(500).json({
        message: 'Error al obtener estado del juego',
        error: error.message,
      });
    }
  }

  async verCartillasJugadores({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail();

      if (!user.esAnfitrion) {
        return response.status(403).json({
          message: 'Solo el anfitrión puede ver las cartillas',
        });
      }

      const juego = await Juego.findOrFail(user.juegoId!);
      const jugadores = await User.query()
        .where('juegoId', juego.id)
        .preload('carta', (cartaQuery) => {
          cartaQuery.preload('fichas');
        });

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
            };
          }

          const cartasIds = jugador.carta.mazoCartaIds;
          const cartasInfo = await MazoCarta.query().whereIn('id', cartasIds);
          const sortedCartasInfo = cartasIds
            .map(id => cartasInfo.find(c => c.id === id))
            .filter(c => c !== undefined);
          logger.info('Cartas de jugador %d enviadas al frontend: %o', jugador.id, sortedCartasInfo.map(c => c.id));

          const fichasMarcadas = Array(16).fill(false);
          jugador.carta.fichas.forEach((ficha) => {
            fichasMarcadas[ficha.posicion] = true;
          });

          return {
            jugador: {
              id: jugador.id,
              email: jugador.email,
              esTramposo: jugador.esTramposo,
            },
            cartilla: {
              cartas: sortedCartasInfo,
              fichas: fichasMarcadas,
            },
          };
        })
      );

      return response.json({
        message: 'Cartillas obtenidas',
        cartillas: cartillasJugadores,
      });
    } catch (error) {
      logger.error('Error al obtener cartillas: %o', error);
      return response.status(500).json({
        message: 'Error al obtener cartillas',
        error: error.message,
      });
    }
  }


  async salirJuego({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      logger.info('Usuario %d intenta salir del juego', user.id);

      if (!user.juegoId) {
        logger.info('Usuario %d no está en ningún juego, permitiendo salir', user.id);
        return response.json({
          message: 'Has salido del juego exitosamente',
        });
      }

      const juegoId = user.juegoId;
      const juego = await Juego.findOrFail(juegoId);

      const carta = await Carta.query()
        .where('usuarioId', user.id)
        .where('juegoId', juegoId)
        .first();

      if (carta) {
        await Ficha.query().where('cartaId', carta.id).delete();
        await carta.delete();
        logger.info('Carta y fichas eliminadas para usuario %d en juego %d', user.id, juegoId);
      }

      let confirmacionesRevancha = juego.confirmacionesRevancha || [];
      confirmacionesRevancha = confirmacionesRevancha.filter(id => id !== user.id);
      juego.confirmacionesRevancha = confirmacionesRevancha;
      await juego.save();

      user.juegoId = null;
      user.esAnfitrion = false;
      user.esTramposo = false;
      await user.save();
      logger.info('Usuario %d removido del juego %d, esAnfitrion: %s, esTramposo: %s', user.id, juegoId, user.esAnfitrion, user.esTramposo);

      const jugadoresRestantes = await User.query().where('juegoId', juegoId);

      if (jugadoresRestantes.length > 0) {
        if (user.id === juego.anfitrionId) {
          const nuevoAnfitrion = jugadoresRestantes[0];
          nuevoAnfitrion.esAnfitrion = true;
          await nuevoAnfitrion.save();
          juego.anfitrionId = nuevoAnfitrion.id;
          await juego.save();
          logger.info('Nuevo anfitrión asignado: %d', nuevoAnfitrion.id);
        }
      } else {
        await Juego.query().where('id', juegoId).delete();
        logger.info('Juego eliminado, no quedan jugadores: %d', juegoId);
      }

      return response.json({
        message: 'Has salido del juego exitosamente',
      });
    } catch (error) {
      logger.error('Error al salir del juego: %o', error);
      return response.status(500).json({
        message: 'Error al salir del juego',
        error: error.message,
      });
    }
  }

  async revancha({ auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail();
      logger.log('info', 'Usuario %d intenta proponer revancha', user.id);

      const juego = await Juego.query()
        .where('id', user.juegoId!)
        .preload('jugadores')
        .firstOrFail();

      if (user.id !== juego.anfitrionId) {
        logger.log('warn', 'Usuario %d no es anfitrión', user.id);
        return response.status(403).json({
          message: 'Solo el anfitrión puede iniciar una revancha',
        });
      }

      if (juego.estado !== 'finalizado') {
        logger.log('warn', 'Juego %d no está finalizado, estado: %s', juego.id, juego.estado);
        if (!juego.estado || !['esperando', 'iniciado', 'finalizado', 'revancha_pendiente'].includes(juego.estado)) {
          logger.log('error', 'Estado inválido detectado para juego %d: %s', juego.id, juego.estado);
          if (juego.ganadorId) {
            juego.estado = 'finalizado';
            await juego.save();
            logger.log('info', 'Estado corregido a finalizado para juego %d', juego.id);
          } else {
            return response.status(400).json({
              message: 'Estado del juego inválido, no se puede proponer revancha',
            });
          }
        } else {
          return response.status(400).json({
            message: 'Solo se puede iniciar una revancha cuando el juego ha terminado',
          });
        }
      }

      const jugadores = await User.query()
        .where('juegoId', juego.id)
        .where('esTramposo', false);
      const totalJugadores = jugadores.length;

      if (totalJugadores < 4) {
        logger.log('warn', 'Juego %d tiene menos de 4 jugadores para revancha', juego.id);
        return response.status(400).json({
          message: 'Se necesitan al menos 4 jugadores para una revancha',
        });
      }

      await Juego.transaction(async (trx) => {
        juego.useTransaction(trx);
        juego.estado = 'revancha_pendiente';
        juego.confirmacionesRevancha = [user.id];
        await juego.save();
        logger.log('info', 'Juego %d actualizado a revancha_pendiente, confirmaciones: %o', juego.id, juego.confirmacionesRevancha);
      });

      const updatedJuego = await Juego.query()
        .where('id', juego.id)
        .firstOrFail();
      if (updatedJuego.estado !== 'revancha_pendiente') {
        logger.error('Estado no actualizado correctamente en DB: %s', updatedJuego.estado);
        throw new Error('Fallo al actualizar estado a revancha_pendiente');
      }

      const jugadoresConfirmados = [{ id: user.id, email: user.email }];

      return response.json({
        message: 'Propuesta de revancha iniciada',
        juego: {
          id: juego.id,
          estado: updatedJuego.estado,
          maxJugadores: juego.maxJugadores,
          esAnfitrion: true,
          totalJugadores,
          confirmacionesRevancha: jugadoresConfirmados,
          cartasAnunciadas: juego.cartasAnunciadas,
          tramposos: juego.tramposos,
          ganadorId: juego.ganadorId,
          ganadorEmail: (await User.find(juego.ganadorId))?.email || null,
        },
      });
    } catch (error) {
      logger.log('error', 'Error al iniciar propuesta de revancha: %o', error);
      return response.status(500).json({
        message: 'Error al iniciar propuesta de revancha',
        error: error.message,
      });
    }
  }

  async confirmarRevancha({ auth, request, response }: HttpContext) {
    try {
      logger.info('Attempting to authenticate user for confirmarRevancha');
      const user = await auth.getUserOrFail();
      const { aceptar } = request.only(['aceptar']);
      logger.info('ConfirmarRevancha request received: user=%o, body=%o', { id: user.id, email: user.email }, request.all());

      if (!user.juegoId) {
        logger.warn('Usuario %d no está en un juego', user.id);
        return response.status(400).json({
          message: 'No estás en ningún juego',
        });
      }

      const juego = await Juego.query()
        .where('id', user.juegoId)
        .preload('jugadores')
        .firstOrFail();

      if (juego.estado !== 'revancha_pendiente') {
        logger.warn('Juego %d no está en revancha_pendiente, estado: %s', juego.id, juego.estado);
        return response.status(400).json({
          message: 'No hay una propuesta de revancha activa',
        });
      }

      if (user.id === juego.anfitrionId) {
        logger.warn('Usuario %d es anfitrión, ya está confirmado', user.id);
        return response.status(400).json({
          message: 'El anfitrión ya está confirmado',
        });
      }

      let confirmacionesRevancha = juego.confirmacionesRevancha || [];
      let jugadoresRestantes = await User.query().where('juegoId', juego.id);

      if (aceptar) {
        if (!confirmacionesRevancha.includes(user.id)) {
          confirmacionesRevancha.push(user.id);
          juego.confirmacionesRevancha = confirmacionesRevancha;
          await juego.save();
          logger.info('Usuario %d confirmó revancha, confirmaciones: %o', user.id, confirmacionesRevancha);
        } else {
          logger.info('Usuario %d ya había confirmado la revancha', user.id);
        }
      } else {
        const carta = await Carta.query()
          .where('usuarioId', user.id)
          .where('juegoId', juego.id)
          .first();
        if (carta) {
          await Ficha.query().where('cartaId', carta.id).delete();
          await carta.delete();
        }

        confirmacionesRevancha = confirmacionesRevancha.filter(id => id !== user.id);
        juego.confirmacionesRevancha = confirmacionesRevancha;
        await juego.save();

        user.juegoId = null;
        user.esTramposo = false;
        await user.save();
        logger.info('Usuario %d rechazó revancha, salió del juego', user.id);

        jugadoresRestantes = await User.query().where('juegoId', juego.id);
        if (jugadoresRestantes.length < 4) {
          for (const jugador of jugadoresRestantes) {
            const carta = await Carta.query()
              .where('usuarioId', jugador.id)
              .where('juegoId', juego.id)
              .first();
            if (carta) {
              await Ficha.query().where('cartaId', carta.id).delete();
              await carta.delete();
            }
            jugador.juegoId = null;
            jugador.esTramposo = false;
            await jugador.save();
          }
          await Juego.query().where('id', juego.id).delete();
          logger.info('Juego %d eliminado, menos de 4 jugadores', juego.id);
          return response.json({
            message: 'Has rechazado la revancha y el juego ha sido terminado por falta de jugadores',
          });
        }
      }

      const jugadoresConfirmados = await User.query()
        .whereIn('id', confirmacionesRevancha)
        .select('id', 'email')
        .exec();

      const responseData = {
        message: aceptar ? 'Has confirmado la revancha' : 'Has rechazado la revancha',
        juego: {
          id: juego.id,
          estado: juego.estado,
          maxJugadores: juego.maxJugadores,
          totalJugadores: jugadoresRestantes.length,
          confirmacionesRevancha: jugadoresConfirmados.map(u => ({ id: u.id, email: u.email })),
        },
      };

      logger.info('Respuesta enviada al frontend: %o', responseData);
      return response.json(responseData);
    } catch (error) {
      logger.error('Error al confirmar/rechazar revancha: %o', {
        message: error.message,
        stack: error.stack,
        code: error.code,
      });
      return response.status(500).json({
        message: 'Error al confirmar/rechazar revancha',
        error: error.message,
      });
    }
  }

  async crearRevancha({ auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail();
      logger.info('Usuario %d intenta crear revancha', user.id);

      const oldJuego = await Juego.query()
        .where('id', user.juegoId!)
        .preload('jugadores')
        .firstOrFail();

      if (user.id !== oldJuego.anfitrionId) {
        logger.warn('Usuario %d no es anfitrión', user.id);
        return response.status(403).json({
          message: 'Solo el anfitrión puede crear la revancha',
        });
      }

      if (oldJuego.estado !== 'revancha_pendiente') {
        logger.warn('Juego %d no está en revancha_pendiente, estado: %s', oldJuego.id, oldJuego.estado);
        return response.status(400).json({
          message: 'No hay una propuesta de revancha activa',
        });
      }

      const confirmacionesRevancha = oldJuego.confirmacionesRevancha || [];
      const jugadoresConfirmados = await User.query()
        .whereIn('id', confirmacionesRevancha)
        .where('esTramposo', false);

      const totalJugadores = jugadoresConfirmados.length;
      if (totalJugadores < 4) {
        logger.warn('Juego %d tiene menos de 4 jugadores confirmados', oldJuego.id);
        return response.status(400).json({
          message: 'Se necesitan al menos 4 jugadores confirmados para crear la revancha',
        });
      }

      if (totalJugadores > oldJuego.maxJugadores) {
        logger.warn('Confirmaciones %d exceden maxJugadores %d', totalJugadores, oldJuego.maxJugadores);
        return response.status(400).json({
          message: 'El número de jugadores confirmados excede el máximo permitido',
        });
      }

      const nuevoJuego = await Juego.transaction(async (trx) => {
        const juego = await Juego.create({
          estado: 'esperando',
          anfitrionId: user.id,
          maxJugadores: oldJuego.maxJugadores,
          cartasAnunciadas: [],
          tramposos: [],
          confirmacionesRevancha: [],
          ganadorId: null,
        });
        juego.useTransaction(trx);
        await juego.save();
        logger.info('Nuevo juego creado para revancha: %o', juego);

        for (const jugador of jugadoresConfirmados) {
          jugador.juegoId = juego.id;
          jugador.esAnfitrion = jugador.id === user.id;
          jugador.useTransaction(trx);
          await jugador.save();
          logger.info('Usuario %d asignado al nuevo juego: %o', jugador.id, jugador);

          const oldCarta = await Carta.query()
            .where('usuarioId', jugador.id)
            .where('juegoId', oldJuego.id)
            .first();
          if (oldCarta) {
            await Ficha.query().where('cartaId', oldCarta.id).useTransaction(trx).delete();
            oldCarta.useTransaction(trx);
            await oldCarta.delete();
          }

          const cartillaIds = await generarCartillaAleatoria();
          const newCarta = await Carta.create({
            juegoId: juego.id,
            usuarioId: jugador.id,
            mazoCartaIds: cartillaIds,
            estaRevelada: false,
          });
          newCarta.useTransaction(trx);
          await newCarta.save();
          logger.info('Nueva cartilla creada para usuario %d: %o', jugador.id, cartillaIds);
        }

        const jugadoresNoConfirmados = await User.query()
          .where('juegoId', oldJuego.id)
          .whereNotIn('id', confirmacionesRevancha);
        for (const jugador of jugadoresNoConfirmados) {
          const carta = await Carta.query()
            .where('usuarioId', jugador.id)
            .where('juegoId', oldJuego.id)
            .first();
          if (carta) {
            await Ficha.query().where('cartaId', carta.id).useTransaction(trx).delete();
            carta.useTransaction(trx);
            await carta.delete();
          }
          jugador.juegoId = null;
          jugador.esTramposo = false;
          jugador.useTransaction(trx);
          await jugador.save();
          logger.info('Usuario %d removido del juego: %o', jugador.id, jugador);
        }

        await Juego.query().where('id', oldJuego.id).useTransaction(trx).delete();
        logger.info('Juego anterior eliminado: %d', oldJuego.id);

        return juego;
      });

      return response.json({
        message: 'Revancha creada exitosamente',
        juego: {
          id: nuevoJuego.id,
          estado: nuevoJuego.estado,
          maxJugadores: nuevoJuego.maxJugadores,
          esAnfitrion: true,
          totalJugadores,
          confirmacionesRevancha: [],
          cartasAnunciadas: [],
          tramposos: [],
          cartaActual: null,
          ganadorId: null,
          ganadorEmail: null,
        },
      });
    } catch (error) {
      logger.error('Error al crear revancha: %o', error);
      return response.status(500).json({
        message: 'Error al crear revancha',
        error: error.message,
      });
    }
  }

  async terminarPartida({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail();
      logger.info('Usuario %d intenta terminar partida', user.id);

      const juego = await Juego.findOrFail(user.juegoId!);

      if (user.id !== juego.anfitrionId) {
        logger.warn('Usuario %d no es anfitrión', user.id);
        return response.status(403).json({
          message: 'Solo el anfitrión puede terminar la partida',
        });
      }

      const jugadores = await User.query().where('juegoId', juego.id);

      for (const jugador of jugadores) {
        const carta = await Carta.query()
          .where('usuarioId', jugador.id)
          .where('juegoId', juego.id)
          .first();
        if (carta) {
          await Ficha.query().where('cartaId', carta.id).delete();
          await carta.delete();
        }
        jugador.juegoId = null;
        jugador.esAnfitrion = false;
        jugador.esTramposo = false;
        await jugador.save();
        logger.info('Usuario %d removido del juego %d, esAnfitrion: %s', jugador.id, juego.id, jugador.esAnfitrion);
      }

      await Juego.query().where('id', juego.id).delete();
      logger.info('Juego terminado y eliminado: %d', juego.id);

      return response.json({
        message: 'Partida terminada exitosamente',
      });
    } catch (error) {
      logger.error('Error al terminar la partida: %o', error);
      return response.status(500).json({
        message: 'Error al terminar la partida',
        error: error.message,
      });
    }
  }
}