import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Fichas extends BaseSchema {
  protected tableName = 'fichas'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('carta_id').notNullable().unsigned()
      table.integer('posicion').notNullable() // Índice 0-15
      table.timestamps(true, true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}