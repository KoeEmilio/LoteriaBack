import { DateTime } from 'luxon'
import { BaseModel, column, beforeSave, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Hash from '@adonisjs/core/services/hash'
import Juego from './juego.js'
import Carta from './carta.js'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare juegoId: number

  @column()
  declare esAnfitrion: boolean

  @column()
  declare esTramposo: boolean

  @column()
  declare email: string

  @column()
  declare password: string

  @column()
  declare rememberMeToken: string | null

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare actualizadoEn: DateTime

  @belongsTo(() => Juego)
  declare juego: BelongsTo<typeof Juego>

  @hasOne(() => Carta)
  declare carta: HasOne<typeof Carta>

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }
}