import { DateTime } from 'luxon'
import { BaseModel, column, hasMany} from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Juego extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare estado: 'esperando' | 'iniciado' | 'finalizado'

  @column()
  declare anfitrionId: number

  @column()
  declare ganadorId: number | null

  @column()
  declare cartasAnunciadas: string[] // Array de IDs de MazoCarta anunciadas

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  @hasMany(() => User)
  declare jugadores: HasMany<typeof User>

  static boot() {
    super.boot()
    this.before('create', async (juego) => {
      if (!juego.cartasAnunciadas) {
        juego.cartasAnunciadas = []
      }
    })
  }
}