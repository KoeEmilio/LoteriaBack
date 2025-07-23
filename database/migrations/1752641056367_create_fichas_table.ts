import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fichas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('carta_id').unsigned().notNullable()
      table.integer('posicion').notNullable()
      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())

      // Evitar duplicados en la misma posición de la misma carta
      table.unique(['carta_id', 'posicion'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}