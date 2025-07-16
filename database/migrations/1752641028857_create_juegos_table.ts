import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Juegos extends BaseSchema {
  protected tableName = 'juegos'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.enum('estado', ['esperando', 'iniciado', 'finalizado']).defaultTo('esperando')
      table.integer('anfitrion_id').notNullable().unsigned()
      table.integer('ganador_id').nullable().unsigned()
      table.json('cartas_anunciadas').defaultTo('[]')
      table.timestamps(true, true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}