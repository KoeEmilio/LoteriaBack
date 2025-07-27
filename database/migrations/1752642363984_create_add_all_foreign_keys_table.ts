import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddAllForeignKeys extends BaseSchema {
  public async up() {
    // Foreign keys para auth_access_tokens
    this.schema.alterTable('auth_access_tokens', (table) => {
      table.foreign('tokenable_id').references('id').inTable('users').onDelete('CASCADE')
    })

    // Foreign keys para users
    this.schema.alterTable('users', (table) => {
      table.foreign('juego_id').references('id').inTable('juegos').onDelete('SET NULL')
    })

    // Foreign keys para juegos
    this.schema.alterTable('juegos', (table) => {
      table.foreign('anfitrion_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('ganador_id').references('id').inTable('users').onDelete('SET NULL')
    })

    // Foreign keys para cartas
    this.schema.alterTable('cartas', (table) => {
      table.foreign('juego_id').references('id').inTable('juegos').onDelete('CASCADE')
      table.foreign('usuario_id').references('id').inTable('users').onDelete('CASCADE')
    })

    // Foreign keys para fichas
    this.schema.alterTable('fichas', (table) => {
      table.foreign('carta_id').references('id').inTable('cartas').onDelete('CASCADE')
    })
  }

  public async down() {
    // Eliminar foreign keys en orden inverso
    this.schema.alterTable('fichas', (table) => {
      table.dropForeign(['carta_id'])
    })

    this.schema.alterTable('cartas', (table) => {
      table.dropForeign(['juego_id'])
      table.dropForeign(['usuario_id'])
    })

    this.schema.alterTable('juegos', (table) => {
      table.dropForeign(['anfitrion_id'])
      table.dropForeign(['ganador_id'])
    })

    this.schema.alterTable('users', (table) => {
      table.dropForeign(['juego_id'])
    })

    this.schema.alterTable('auth_access_tokens', (table) => {
      table.dropForeign(['tokenable_id'])
    })
  }
}
