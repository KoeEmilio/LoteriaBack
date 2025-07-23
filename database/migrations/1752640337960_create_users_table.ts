import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('juego_id').unsigned().nullable()
      table.boolean('es_anfitrion').defaultTo(false)
      table.boolean('es_tramposo').defaultTo(false)
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('remember_me_token').nullable()
      table.timestamp('creado_en', { useTz: true }).defaultTo(this.now())
      table.timestamp('actualizado_en', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}