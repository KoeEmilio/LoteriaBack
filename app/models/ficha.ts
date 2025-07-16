import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Carta from './carta.js'

export default class Ficha extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare cartaId: number

  @column()
  declare posicion: number // Índice de mazoCartaIds (0-15)

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  @belongsTo(() => Carta)
  declare carta: BelongsTo<typeof Carta>
}