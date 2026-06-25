const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const { signAccess } = require('../src/services/tokens');

async function makeUser(email, role, creditBalance = 0) {
  const user = await User.create({ email, password: 'password123', name: email, role, creditBalance });
  return { user, token: signAccess(user) };
}
const bearer = (t) => ({ Authorization: `Bearer ${t}` });

describe('Marketplace credit ledger', () => {
  it('escrows credits when listing and rejects listing more than the balance', async () => {
    const { user, token } = await makeUser('s1@test.com', 'seller', 100);

    const ok = await request(app).post('/api/listings').set(bearer(token)).send({
      title: 'Solar credits', type: 'Solar Energy', price: 5, credits: 40, co2Offset: 4, location: 'AZ',
    });
    expect(ok.status).toBe(201);
    expect((await User.findById(user._id)).creditBalance).toBe(60); // 100 - 40 escrowed

    const tooMuch = await request(app).post('/api/listings').set(bearer(token)).send({
      title: 'Too many', type: 'Solar Energy', price: 5, credits: 1000, co2Offset: 4, location: 'AZ',
    });
    expect(tooMuch.status).toBe(400);
  });

  it('returns escrowed credits when a listing is removed', async () => {
    const { user, token } = await makeUser('s2@test.com', 'seller', 50);
    const listing = await request(app).post('/api/listings').set(bearer(token)).send({
      title: 'X', type: 'Wind Energy', price: 2, credits: 30, co2Offset: 1, location: 'TX',
    });
    await request(app).delete(`/api/listings/${listing.body._id}`).set(bearer(token));
    expect((await User.findById(user._id)).creditBalance).toBe(50); // 50 - 30 + 30
  });

  it('transfers credits and revenue atomically on purchase', async () => {
    const seller = await makeUser('seller3@test.com', 'seller', 100);
    const buyer = await makeUser('buyer3@test.com', 'buyer', 0);
    const listing = await request(app).post('/api/listings').set(bearer(seller.token)).send({
      title: 'Forest', type: 'Reforestation', price: 3, credits: 20, co2Offset: 10, location: 'OR',
    });

    const res = await request(app).post('/api/transactions/purchase').set(bearer(buyer.token))
      .send({ listingId: listing.body._id, credits: 8 });
    expect(res.status).toBe(201);

    expect((await User.findById(buyer.user._id)).creditBalance).toBe(8);
    expect((await User.findById(seller.user._id)).lifetimeRevenue).toBe(24); // 8 * 3
    expect((await Listing.findById(listing.body._id)).credits).toBe(12);     // 20 - 8
  });

  it('does NOT oversell under concurrent purchases (the critical race fix)', async () => {
    const seller = await makeUser('seller4@test.com', 'seller', 100);
    const b1 = await makeUser('b1@test.com', 'buyer', 0);
    const b2 = await makeUser('b2@test.com', 'buyer', 0);
    const listing = await request(app).post('/api/listings').set(bearer(seller.token)).send({
      title: 'Scarce', type: 'Solar Energy', price: 1, credits: 10, co2Offset: 5, location: 'NV',
    });

    // both buyers race to buy 7 of the only 10 credits — exactly one must win
    const [r1, r2] = await Promise.all([
      request(app).post('/api/transactions/purchase').set(bearer(b1.token)).send({ listingId: listing.body._id, credits: 7 }),
      request(app).post('/api/transactions/purchase').set(bearer(b2.token)).send({ listingId: listing.body._id, credits: 7 }),
    ]);

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([201, 400]); // one success, one rejected — never both

    const remaining = (await Listing.findById(listing.body._id)).credits;
    expect(remaining).toBe(3); // 10 - 7, never negative
  });

  it('rejects buying your own listing', async () => {
    const seller = await makeUser('seller5@test.com', 'seller', 50);
    const listing = await request(app).post('/api/listings').set(bearer(seller.token)).send({
      title: 'Mine', type: 'Solar Energy', price: 1, credits: 5, co2Offset: 1, location: 'CA',
    });
    const res = await request(app).post('/api/transactions/purchase').set(bearer(seller.token))
      .send({ listingId: listing.body._id, credits: 1 });
    expect(res.status).toBe(400);
  });
});
