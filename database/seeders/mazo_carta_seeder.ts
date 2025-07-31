import { BaseSeeder } from '@adonisjs/lucid/seeders'
import MazoCarta from '#models/mazo_carta'

export default class MazoCartasSeeder extends BaseSeeder {
  async run() {
    const cartas = [
      { numero: 1, nombre: 'El Gallo', imagen: '/cartas/01_el_gallo.jpg' },
      { numero: 2, nombre: 'El Diablito', imagen: '/cartas/02_el_diablito.jpg' },
      { numero: 3, nombre: 'La Dama', imagen: '/cartas/03_la_dama.jpg' },
      { numero: 4, nombre: 'El Catrín', imagen: '/cartas/04_el_catrin.jpg' },
      { numero: 5, nombre: 'El Paraguas', imagen: '/cartas/05_el_paraguas.jpg' },
      { numero: 6, nombre: 'La Sirena', imagen: '/cartas/06_la_sirena.jpg' },
      { numero: 7, nombre: 'La Escalera', imagen: '/cartas/07_la_escalera.jpg' },
      { numero: 8, nombre: 'La Botella', imagen: '/cartas/08_la_botella.jpg' },
      { numero: 9, nombre: 'El Barril', imagen: '/cartas/09_el_barril.jpg' },
      { numero: 10, nombre: 'El Árbol', imagen: '/cartas/10_el_arbol.jpg' },
      { numero: 11, nombre: 'El Melón', imagen: '/cartas/11_el_melon.jpg' },
      { numero: 12, nombre: 'El Valiente', imagen: '/cartas/12_el_valiente.jpg' },
      { numero: 13, nombre: 'El Gorrito', imagen: '/cartas/13_el_gorrito.jpg' },
      { numero: 14, nombre: 'La Muerte', imagen: '/cartas/14_la_muerte.jpg' },
      { numero: 15, nombre: 'La Pera', imagen: '/cartas/15_la_pera.jpg' },
      { numero: 16, nombre: 'La Bandera', imagen: '/cartas/16_la_bandera.jpg' },
      { numero: 17, nombre: 'El Bandolón', imagen: '/cartas/17_el_bandolon.jpg' },
      { numero: 18, nombre: 'El Violoncello', imagen: '/cartas/18_el_violoncello.jpg' },
      { numero: 19, nombre: 'La Garza', imagen: '/cartas/19_la_garza.jpg' },
      { numero: 20, nombre: 'El Pájaro', imagen: '/cartas/20_el_pajaro.jpg' },
      { numero: 21, nombre: 'La Mano', imagen: '/cartas/21_la_mano.jpg' },
      { numero: 22, nombre: 'La Bota', imagen: '/cartas/22_la_bota.jpg' },
      { numero: 23, nombre: 'La Luna', imagen: '/cartas/23_la_luna.jpg' },
      { numero: 24, nombre: 'El Cotorro', imagen: '/cartas/24_el_cotorro.jpg' },
      { numero: 25, nombre: 'El Borracho', imagen: '/cartas/25_el_borracho.jpg' },
      { numero: 26, nombre: 'El Negrito', imagen: '/cartas/26_el_negrito.jpg' },
      { numero: 27, nombre: 'El Corazón', imagen: '/cartas/27_el_corazon.jpg' },
      { numero: 28, nombre: 'La Sandía', imagen: '/cartas/28_la_sandia.jpg' },
      { numero: 29, nombre: 'El Tambor', imagen: '/cartas/29_el_tambor.jpg' },
      { numero: 30, nombre: 'El Camarón', imagen: '/cartas/30_el_camaron.jpg' },
      { numero: 31, nombre: 'Las Jaras', imagen: '/cartas/31_las_jaras.jpg' },
      { numero: 32, nombre: 'El Músico', imagen: '/cartas/32_el_musico.jpg' },
      { numero: 33, nombre: 'La Araña', imagen: '/cartas/33_la_arana.jpg' },
      { numero: 34, nombre: 'El Soldado', imagen: '/cartas/34_el_soldado.jpg' },
      { numero: 35, nombre: 'La Estrella', imagen: '/cartas/35_la_estrella.jpg' },
      { numero: 36, nombre: 'El Cazo', imagen: '/cartas/36_el_cazo.jpg' },
      { numero: 37, nombre: 'El Mundo', imagen: '/cartas/37_el_mundo.jpg' },
      { numero: 38, nombre: 'El Apache', imagen: '/cartas/38_el_apache.jpg' },
      { numero: 39, nombre: 'El Nopal', imagen: '/cartas/39_el_nopal.jpg' },
      { numero: 40, nombre: 'El Alacrán', imagen: '/cartas/40_el_alacran.jpg' },
      { numero: 41, nombre: 'La Rosa', imagen: '/cartas/41_la_rosa.jpg' },
      { numero: 42, nombre: 'La Calavera', imagen: '/cartas/42_la_calavera.jpg' },
      { numero: 43, nombre: 'La Campana', imagen: '/cartas/43_la_campana.jpg' },
      { numero: 44, nombre: 'El Cantarito', imagen: '/cartas/44_el_cantarito.jpg' },
      { numero: 45, nombre: 'El Venado', imagen: '/cartas/45_el_venado.jpg' },
      { numero: 46, nombre: 'El Sol', imagen: '/cartas/46_el_sol.jpg' },
      { numero: 47, nombre: 'La Corona', imagen: '/cartas/47_la_corona.jpg' },
      { numero: 48, nombre: 'La Chalupa', imagen: '/cartas/48_la_chalupa.jpg' },
      { numero: 49, nombre: 'El Pino', imagen: '/cartas/49_el_pino.jpg' },
      { numero: 50, nombre: 'El Pescado', imagen: '/cartas/50_el_pescado.jpg' },
      { numero: 51, nombre: 'La Palma', imagen: '/cartas/51_la_palma.jpg' },
      { numero: 52, nombre: 'La Maceta', imagen: '/cartas/52_la_maceta.jpg' },
      { numero: 53, nombre: 'El Arpa', imagen: '/cartas/53_el_arpa.jpg' },
      { numero: 54, nombre: 'La Rana', imagen: '/cartas/54_la_rana.jpg' },
    ]

    for (const carta of cartas) {
      const existingCarta = await MazoCarta.query().where('numero', carta.numero).first()
      if (!existingCarta) {
        await MazoCarta.create(carta)
      }
    }
  }
}
