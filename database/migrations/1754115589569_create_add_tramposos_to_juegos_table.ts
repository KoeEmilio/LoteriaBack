import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'juegos'

   async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('tramposos').defaultTo('[]')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('tramposos')
    })
  }
}