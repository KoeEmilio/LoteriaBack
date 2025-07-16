import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Cartas extends BaseSchema {
  protected tableName = 'cartas'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('juego_id').notNullable().unsigned()
      table.integer('usuario_id').notNullable().unsigned()
      table.json('mazo_carta_ids').notNullable() // Array de 16 IDs
      table.boolean('esta_revelada').defaultTo(false)
      table.timestamps(true, true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}