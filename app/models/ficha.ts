import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Carta from './carta.js'

export default class Ficha extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'carta_id' })
  declare cartaId: number

  @column()
  declare posicion: number

  @column.dateTime({ autoCreate: true, columnName: 'creado_en' })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'actualizado_en' })
  declare actualizadoEn: DateTime

  @belongsTo(() => Carta, {
    foreignKey: 'cartaId'
  })
  declare carta: BelongsTo<typeof Carta>
}