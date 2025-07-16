import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Users extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('juego_id').nullable().unsigned()
      table.boolean('es_anfitrion').defaultTo(false)
      table.boolean('es_tramposo').defaultTo(false)
      table.string('email', 255).notNullable().unique()
      table.string('password', 180).notNullable()
      table.string('remember_me_token').nullable()
      table.timestamps(true, true, true) 
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}