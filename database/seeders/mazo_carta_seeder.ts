import { BaseSeeder } from '@adonisjs/lucid/seeders'
import MazoCarta from '#models/mazo_carta'

export default class MazoCartasSeeder extends BaseSeeder {
  async run() {
    const cartas = [
      { numero: 1, nombre: 'El Gallo', imagen: '/cartas/01 el gallo.jpg' },
      { numero: 2, nombre: 'El Diablito', imagen: '/cartas/02 el diablito.jpg' },
      { numero: 3, nombre: 'La Dama', imagen: '/cartas/03 la dama.jpg' },
      { numero: 4, nombre: 'El Catrín', imagen: '/cartas/04 el catrin.jpg' },
      { numero: 5, nombre: 'El Paraguas', imagen: '/cartas/05 el paraguas.jpg' },
      { numero: 6, nombre: 'La Sirena', imagen: '/cartas/06 la sirena.jpg' },
      { numero: 7, nombre: 'La Escalera', imagen: '/cartas/07 la escalera.jpg' },
      { numero: 8, nombre: 'La Botella', imagen: '/cartas/08 la botella.jpg' },
      { numero: 9, nombre: 'El Barril', imagen: '/cartas/09 el barril.jpg' },
      { numero: 10, nombre: 'El Árbol', imagen: '/cartas/10 el arbol.jpg' },
      { numero: 11, nombre: 'El Melón', imagen: '/cartas/11 el melon.jpg' },
      { numero: 12, nombre: 'El Valiente', imagen: '/cartas/12 el valiente.jpg' },
      { numero: 13, nombre: 'El Gorrito', imagen: '/cartas/13 el gorrito.jpg' },
      { numero: 14, nombre: 'La Muerte', imagen: '/cartas/14 la muerte.jpg' },
      { numero: 15, nombre: 'La Pera', imagen: '/cartas/15 la pera.jpg' },
      { numero: 16, nombre: 'La Bandera', imagen: '/cartas/16 la bandera.jpg' },
      { numero: 17, nombre: 'El Bandolón', imagen: '/cartas/17 el bandoneon.jpg' },
      { numero: 18, nombre: 'El Violoncello', imagen: '/cartas/18 el violoncello.jpg' },
      { numero: 19, nombre: 'La Garza', imagen: '/cartas/19 la garza.jpg' },
      { numero: 20, nombre: 'El Pájaro', imagen: '/cartas/20 el pajaro.jpg' },
      { numero: 21, nombre: 'La Mano', imagen: '/cartas/21 la mano.jpg' },
      { numero: 22, nombre: 'La Bota', imagen: '/cartas/22 la bota.jpg' },
      { numero: 23, nombre: 'La Luna', imagen: '/cartas/23 la luna.jpg' },
      { numero: 24, nombre: 'El Cotorro', imagen: '/cartas/24 el cotorro.jpg' },
      { numero: 25, nombre: 'El Borracho', imagen: '/cartas/25 el borracho.jpg' },
      { numero: 26, nombre: 'El Negrito', imagen: '/cartas/26 el negrito.jpg' },
      { numero: 27, nombre: 'El Corazón', imagen: '/cartas/27 el corazon.jpg' },
      { numero: 28, nombre: 'La Sandía', imagen: '/cartas/28 la sandia.jpg' },
      { numero: 29, nombre: 'El Tambor', imagen: '/cartas/29 el tambor.jpg' },
      { numero: 30, nombre: 'El Camarón', imagen: '/cartas/30 el camaron.jpg' },
      { numero: 31, nombre: 'Las Jaras', imagen: '/cartas/31 las jaras.jpg' },
      { numero: 32, nombre: 'El Músico', imagen: '/cartas/32 el musico.jpg' },
      { numero: 33, nombre: 'La Araña', imagen: '/cartas/33 la arana.jpg' },
      { numero: 34, nombre: 'El Soldado', imagen: '/cartas/34 el soldado.jpg' },
      { numero: 35, nombre: 'La Estrella', imagen: '/cartas/35 la estrella.jpg' },
      { numero: 36, nombre: 'El Cazo', imagen: '/cartas/36 el cazo.jpg' },
      { numero: 37, nombre: 'El Mundo', imagen: '/cartas/37 el mundo.jpg' },
      { numero: 38, nombre: 'El Apache', imagen: '/cartas/38 el apache.jpg' },
      { numero: 39, nombre: 'El Nopal', imagen: '/cartas/39 el nopal.jpg' },
      { numero: 40, nombre: 'El Alacrán', imagen: '/cartas/40 el alacran.jpg' },
      { numero: 41, nombre: 'La Rosa', imagen: '/cartas/41 la rosa.jpg' },
      { numero: 42, nombre: 'La Calavera', imagen: '/cartas/42 la calavera.jpg' },
      { numero: 43, nombre: 'La Campana', imagen: '/cartas/43 la campana.jpg' },
      { numero: 44, nombre: 'El Cantarito', imagen: '/cartas/44 el cantarito.jpg' },
      { numero: 45, nombre: 'El Venado', imagen: '/cartas/45 el venado.jpg' },
      { numero: 46, nombre: 'El Sol', imagen: '/cartas/46 el sol.jpg' },
      { numero: 47, nombre: 'La Corona', imagen: '/cartas/47 la corona.jpg' },
      { numero: 48, nombre: 'La Chalupa', imagen: '/cartas/48 la chalupa.jpg' },
      { numero: 49, nombre: 'El Pino', imagen: '/cartas/49 el pino.jpg' },
      { numero: 50, nombre: 'El Pescado', imagen: '/cartas/50 el pescado.jpg' },
      { numero: 51, nombre: 'La Palma', imagen: '/cartas/51 la palma.jpg' },
      { numero: 52, nombre: 'La Maceta', imagen: '/cartas/52 la maceta.jpg' },
      { numero: 53, nombre: 'El Arpa', imagen: '/cartas/53 el arpa.jpg' },
      { numero: 54, nombre: 'La Rana', imagen: '/cartas/54 la rana.jpg' },
    ]

    for (const carta of cartas) {
      const existingCarta = await MazoCarta.query().where('numero', carta.numero).first()
      if (!existingCarta) {
        await MazoCarta.create(carta)
      }
    }
  }
}