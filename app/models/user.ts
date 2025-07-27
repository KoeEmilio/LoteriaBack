import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import hash from '@adonisjs/core/services/hash'
import Juego from './juego.js'
import Carta from './carta.js'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'juego_id' })
  declare juegoId: number | null

  @column({ columnName: 'es_anfitrion' })
  declare esAnfitrion: boolean

  @column({ columnName: 'es_tramposo' })
  declare esTramposo: boolean

  @column()
  declare email: string

  @column()
  declare password: string

  @column({ columnName: 'remember_me_token' })
  declare rememberMeToken: string | null

  @column.dateTime({ autoCreate: true, columnName: 'creado_en' })
  declare creadoEn: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'actualizado_en' })
  declare actualizadoEn: DateTime

  @belongsTo(() => Juego, {
    foreignKey: 'juegoId',
  })
  declare juego: BelongsTo<typeof Juego>

  @hasOne(() => Carta, {
    foreignKey: 'usuarioId',
  })
  declare carta: HasOne<typeof Carta>

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }

  static async verifyCredentials(email: string, password: string) {
    const user = await User.findByOrFail('email', email)
    const isPasswordValid = await hash.verify(user.password, password)

    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas')
    }

    return user
  }

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
