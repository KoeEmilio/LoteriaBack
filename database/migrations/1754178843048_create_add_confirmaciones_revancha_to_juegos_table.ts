import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'juegos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('confirmaciones_revancha').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('confirmaciones_revancha')
    })
  }
}