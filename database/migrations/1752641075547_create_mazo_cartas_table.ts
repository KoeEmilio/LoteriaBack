import { BaseSchema } from '@adonisjs/lucid/schema'


export default class MazoCartas extends BaseSchema {
  protected tableName = 'mazo_cartas'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('numero').notNullable().unique()
      table.string('nombre').notNullable()
      table.string('imagen').notNullable()
      table.timestamps(true, true, true) // useTimestamps, defaultToNow, useCamelCase
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}