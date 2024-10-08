import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { knex } from '../database';
import { checkSessionIdExists } from '../middlewares/checkSessionIdExists';

export async function transactionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    console.log(`Route: ${request.method} ${request.url}`);
  });

  // get all transactions
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select();

      return reply.status(200).send({ transactions });
    },
  );

  // get one transaction
  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getTransactionParamsSchema.parse(request.params);

      const transaction = await knex('transactions')
        .where({ id, session_id: sessionId })
        .first();

      return reply.status(200).send({ transaction });
    },
  );

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

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    });

    return reply.status(201).send('Transaction created');
  });

  // summary
  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first();

      return reply.status(200).send({ summary });
    },
  );
}
