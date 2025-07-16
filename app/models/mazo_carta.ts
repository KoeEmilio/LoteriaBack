import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class MazoCarta extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare numero: number // 1-55

  @column()
  declare nombre: string // Ej. "El Diablito", "La Calavera"

  @column()
  declare imagen: string // Ruta o URL de la imagen

  @column.dateTime({ autoCreate: true })
  declare creadoEn: DateTime
}