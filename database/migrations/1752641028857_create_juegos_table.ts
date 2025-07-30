import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'juegos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.enum('estado', ['esperando', 'iniciado', 'finalizado']).defaultTo('esperando')
      table.integer('anfitrion_id').unsigned().nullable()
      table.integer('ganador_id').unsigned().nullable()
      table.integer('max_jugadores').notNullable().defaultTo(16)
      table.json('cartas_anunciadas').defaultTo('[]')
      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
