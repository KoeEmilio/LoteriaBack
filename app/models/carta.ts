import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Juego from './juego.js'
import User from './user.js'
import Ficha from './ficha.js'

export default class Carta extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'juego_id' })
  declare juegoId: number

  @column({ columnName: 'usuario_id' })
  declare usuarioId: number

  @column({
    columnName: 'mazo_carta_ids',
    prepare: (value: number[]) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value || '[]')
  })
  declare mazoCartaIds: number[]

  @column({ columnName: 'esta_revelada' })
  declare estaRevelada: boolean

  @column.dateTime({ autoCreate: true, columnName: 'creado_en' })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'actualizado_en' })
  declare actualizadoEn: DateTime

  @belongsTo(() => Juego, {
    foreignKey: 'juegoId'
  })
  declare juego: BelongsTo<typeof Juego>

  @belongsTo(() => User, {
    foreignKey: 'usuarioId'
  })
  declare usuario: BelongsTo<typeof User>

  @hasMany(() => Ficha, {
    foreignKey: 'cartaId'
  })
  declare fichas: HasMany<typeof Ficha>
}