import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Juego extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare estado: 'esperando' | 'iniciado' | 'finalizado'

  @column({ columnName: 'anfitrion_id' })
  declare anfitrionId: number

  @column({ columnName: 'ganador_id' })
  declare ganadorId: number | null

  @column({
    columnName: 'cartas_anunciadas',
    prepare: (value: number[]) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value || '[]'),
  })
  declare cartasAnunciadas: number[]

  @column.dateTime({ autoCreate: true, columnName: 'creado_en' })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'actualizado_en' })
  declare actualizadoEn: DateTime

  @hasMany(() => User, {
    foreignKey: 'juegoId',
  })
  declare jugadores: HasMany<typeof User>
}
