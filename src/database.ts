import { Knex, knex as setupKnex } from 'knex';

export const knexConfig: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: './database/db.sqlite',
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './database/migrations',
  },
};

export const knex = setupKnex(knexConfig);
