import { execSync } from 'node:child_process';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app';

describe('transactions', () => {
  beforeAll(async () => {
    await app.ready();

    execSync('npm run knex migrate:rollback --all');
    execSync('npm run knex migrate:latest');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create transaction', async () => {
    const response = await supertest(app.server).post('/transactions').send({
      title: 'new transaction',
      amount: 5000,
      type: 'credit',
    });

    expect(response.statusCode).toEqual(201);
    expect(response.text).toEqual('Transaction created');
  });

  it('should be able to list all transaction', async () => {
    const create = await supertest(app.server).post('/transactions').send({
      title: 'new transaction 2',
      amount: 3000,
      type: 'credit',
    });

    const cookie = create.get('Set-Cookie');

    const response = await supertest(app.server)
      .get('/transactions')
      .set('Cookie', cookie!)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.transactions).toHaveLength(1);
    expect(response.body.transactions[0].title).toEqual('new transaction 2');
    expect(response.body.transactions[0].amount).toEqual(3000);
  });

  it('should be able to get one transaction', async () => {
    const create = await supertest(app.server).post('/transactions').send({
      title: 'new transaction 2',
      amount: 3000,
      type: 'credit',
    });

    const cookie = create.get('Set-Cookie');

    const response = await supertest(app.server)
      .get('/transactions')
      .set('Cookie', cookie!)
      .send();

    const transactionId = response.body.transactions[0].id;

    const singleTransaction = await supertest(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookie!)
      .send();

    expect(singleTransaction.statusCode).toEqual(200);
    expect(singleTransaction.body.transaction.id).toEqual(transactionId);
    expect(singleTransaction.body.transaction.title).toEqual(
      'new transaction 2',
    );
    expect(singleTransaction.body.transaction.amount).toEqual(3000);
  });

  it('should be able to get summary', async () => {
    const create = await supertest(app.server).post('/transactions').send({
      title: 'credit transaction',
      amount: 5000,
      type: 'credit',
    });

    const cookie = create.get('Set-Cookie');

    await supertest(app.server)
      .post('/transactions')
      .set('Cookie', cookie!)
      .send({
        title: 'debit transaction',
        amount: 3000,
        type: 'debit',
      });

    const response = await supertest(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookie!)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.summary.amount).toEqual(2000);
  });
});
