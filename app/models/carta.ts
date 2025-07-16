import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Juego from './juego.js'
import User from './user.js'
import Ficha from './ficha.js'

export default class Carta extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare juegoId: number

  @column()
  declare usuarioId: number

  @column()
  declare mazoCartaIds: string[] // Array de 16 IDs de MazoCarta para la cartilla

  @column()
  declare estaRevelada: boolean // Para el anfitrión que vea la cartilla

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  @belongsTo(() => Juego)
  declare juego: BelongsTo<typeof Juego>

  @belongsTo(() => User, {
    foreignKey: 'usuarioId', 
  })
  declare usuario: BelongsTo<typeof User>

  @hasMany(() => Ficha)
  declare fichas: HasMany<typeof Ficha>
}