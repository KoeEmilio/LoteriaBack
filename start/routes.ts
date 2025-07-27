import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// Rutas de autenticación
router
  .group(() => {
    router.post('/register', '#controllers/auth_controller.register')
    router.post('/login', '#controllers/auth_controller.login')
    router.post('/logout', '#controllers/auth_controller.logout').use(middleware.auth())
    router.get('/me', '#controllers/auth_controller.me').use(middleware.auth())
  })
  .prefix('/auth')

// Rutas del juego
router
  .group(() => {
    router.post('/crear', '#controllers/juegos_controller.crearPartida')
    router.post('/unirse', '#controllers/juegos_controller.unirsePartida')
    router.post('/iniciar', '#controllers/juegos_controller.iniciarPartida')
    router.post('/revelar-carta', '#controllers/juegos_controller.revelarCarta')
    router.post('/marcar-ficha', '#controllers/juegos_controller.marcarFicha')
    router.get('/estado', '#controllers/juegos_controller.obtenerEstadoJuego')
    router.get('/cartillas', '#controllers/juegos_controller.verCartillasJugadores')
    router.post('/salir', '#controllers/juegos_controller.salirJuego')
  })
  .prefix('/juego')
  .use(middleware.auth())
