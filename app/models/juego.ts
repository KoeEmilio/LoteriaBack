import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import logger from '@adonisjs/core/services/logger'
import User from './user.js'

export default class Juego extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({
    columnName: 'estado',
    prepare: (value: string) => {
      const validStates = ['esperando', 'iniciado', 'finalizado', 'revancha_pendiente'];
      if (!value || !validStates.includes(value)) {
        logger.warn('Estado inválido asignado: %s, usando "esperando" por defecto', value);
        return 'esperando';
      }
      return value;
    },
  })
  declare estado: 'esperando' | 'iniciado' | 'finalizado' | 'revancha_pendiente';

  @column({ columnName: 'anfitrion_id' })
  declare anfitrionId: number

  @column({ columnName: 'ganador_id' })
  declare ganadorId: number | null

  @column({ columnName: 'max_jugadores' })
  declare maxJugadores: number

  @column({
    columnName: 'cartas_anunciadas',
    prepare: (value: number[] = []) => JSON.stringify(value),
    consume: (value: string | null) => (value ? JSON.parse(value) : []) as number[],
  })
  declare cartasAnunciadas: number[]

  @column({
    columnName: 'tramposos',
    prepare: (value: { id: number; email: string }[] = []) => JSON.stringify(value),
    consume: (value: string | null) => (value ? JSON.parse(value) : []) as { id: number; email: string }[],
  })
  declare tramposos: { id: number; email: string }[]

  @column({
    columnName: 'confirmaciones_revancha',
    prepare: (value: number[] = []) => JSON.stringify(value),
    consume: (value: string | null) => (value ? JSON.parse(value) : []) as number[],
  })
  declare confirmacionesRevancha: number[]

  @column.dateTime({ autoCreate: true, columnName: 'creado_en' })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'actualizado_en' })
  declare actualizadoEn: DateTime

  @hasMany(() => User, {
    foreignKey: 'juegoId',
  })
  declare jugadores: HasMany<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'anfitrionId',
  })
  declare anfitrion: BelongsTo<typeof User>

  public async save() {
    logger.info('Guardando juego %d con confirmacionesRevancha: %o, estado: %s', this.id || 'nuevo', this.confirmacionesRevancha, this.estado)
    return super.save()
  }
}