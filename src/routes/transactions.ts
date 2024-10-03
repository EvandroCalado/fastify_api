import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { knex } from '../database';

export async function transactionsRoutes(app: FastifyInstance) {
  // get all transactions
  app.get('/', async (request, reply) => {
    const transactions = await knex('transactions').select();

    return reply.status(200).send({ transactions });
  });

  // get one transaction
  app.get('/:id', async (request, reply) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getTransactionParamsSchema.parse(request.params);

    const transaction = await knex('transactions').where({ id }).first();

    return reply.status(200).send({ transaction });
  });

  // create transation
  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    );

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
    });

    return reply.status(201).send('Transaction created');
  });

  // summary
  app.get('/summary', async (request, reply) => {
    const summary = await knex('transactions')
      .sum('amount', { as: 'amount' })
      .first();

    return reply.status(200).send({ summary });
  });
}
