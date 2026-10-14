import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { User } from "../../src/models/index.js";
import { testOutbox } from "../../src/services/email.service.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../helpers/db.js";
import { createBooking, createCustomer, createProvider, createTeam, createTicket } from "../helpers/factories.js";
import { anonymous, signIn } from "../helpers/http.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

let team;
let admin;
let manager;

beforeEach(async () => {
  await clearTestDb();
  testOutbox.length = 0;
  team = await createTeam();
  admin = await signIn(team.super_admin);
  manager = await signIn(team.manager);
});

describe("team invitations", () => {
  it("adds a member and lets them choose a password from the invite link", async () => {
    const res = await admin.post("/api/team").send({ name: "Nina Newhire", email: "Nina@ServiHub.test", role: "finance" });

    expect(res.status).toBe(201);
    expect(res.body.member).toMatchObject({ email: "nina@servihub.test", role: "finance", invitePending: true });
    expect(res.body.member.passwordHash).toBeUndefined();
    expect(res.body.inviteUrl).toMatch(/^http:\/\/localhost:5173\/reset-password\?token=/);
    expect(testOutbox[0].subject).toMatch(/invited/);

    const token = new URL(res.body.inviteUrl).searchParams.get("token");
    const verify = await anonymous().post("/api/auth/reset-password/verify").send({ token });
    expect(verify.body).toMatchObject({ purpose: "invite", name: "Nina Newhire" });

    expect((await anonymous().post("/api/auth/reset-password").send({ token, password: "Welcome123" })).status).toBe(200);
    const login = await anonymous().post("/api/auth/login").send({ email: "nina@servihub.test", password: "Welcome123" });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe("finance");

    const list = await admin.get("/api/team");
    expect(list.body.members.find((m) => m.email === "nina@servihub.test").invitePending).toBe(false);
  });

  it("rejects duplicate emails", async () => {
    const res = await admin.post("/api/team").send({ name: "Copy Cat", email: team.manager.email, role: "manager" });
    expect(res.status).toBe(409);
    expect(res.body.errors.email).toBeDefined();
  });

  it("can resend an invitation, invalidating the previous link", async () => {
    const created = await admin.post("/api/team").send({ name: "Late Joiner", email: "late@servihub.test", role: "support_agent" });
    const firstToken = new URL(created.body.inviteUrl).searchParams.get("token");

    const resent = await admin.post(`/api/team/${created.body.member._id}/invite`);
    expect(resent.status).toBe(200);
    const secondToken = new URL(resent.body.inviteUrl).searchParams.get("token");

    expect((await anonymous().post("/api/auth/reset-password/verify").send({ token: firstToken })).status).toBe(400);
    expect((await anonymous().post("/api/auth/reset-password/verify").send({ token: secondToken })).status).toBe(200);
  });

  it("protects the last active super admin", async () => {
    const secondAdmin = await signIn(await User.create({
      name: "Second Admin",
      email: "admin2@servihub.test",
      role: "super_admin",
      passwordHash: team.super_admin.passwordHash,
      passwordSetAt: new Date(),
    }));

    // With two admins, one may demote the other...
    const demote = await secondAdmin.patch(`/api/team/${team.super_admin._id}/role`).send({ role: "manager" });
    expect(demote.status).toBe(200);

    // ...but nobody may act on their own account.
    const self = await secondAdmin.get("/api/auth/me");
    const selfId = self.body.user.id;
    expect((await secondAdmin.patch(`/api/team/${selfId}/status`).send({ status: "disabled" })).status).toBe(400);
  });

  it("is super_admin only", async () => {
    expect((await manager.post("/api/team").send({ name: "Nope", email: "nope@servihub.test", role: "finance" })).status).toBe(403);
  });
});

describe("providers", () => {
  it("creates and edits providers", async () => {
    const created = await manager.post("/api/providers").send({
      name: "Paula Pipes",
      phone: "+1 512-555-7777",
      area: "Hyde Park",
      services: ["Plumbing", "Plumbing", "Electrical"],
    });
    expect(created.status).toBe(201);
    expect(created.body.provider).toMatchObject({
      name: "Paula Pipes",
      services: ["Plumbing", "Electrical"],
      isAvailable: true,
      verified: false,
      rating: 0,
    });

    const id = created.body.provider._id;
    const edited = await manager.patch(`/api/providers/${id}`).send({ isAvailable: false, verified: true });
    expect(edited.status).toBe(200);
    expect(edited.body.provider).toMatchObject({ isAvailable: false, verified: true });
  });

  it("validates services and fields", async () => {
    const res = await manager.post("/api/providers").send({ name: "X", phone: "abc", area: "Somewhere", services: ["Gardening"] });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(expect.arrayContaining(["name", "phone"]));
  });

  it("reports earnings and jobs from completed bookings", async () => {
    const provider = await createProvider();
    await createBooking({ provider: provider._id, status: "completed", amount: 120 });
    await createBooking({ provider: provider._id, status: "completed", amount: 80 });
    await createBooking({ provider: provider._id, status: "assigned", amount: 500 });

    const res = await manager.get(`/api/providers/${provider._id}`);
    expect(res.body).toMatchObject({ earnings: 200, jobs: 2, activeBookings: 1 });
  });
});

describe("customers", () => {
  it("creates and edits customers, keeping phone numbers unique", async () => {
    const created = await manager.post("/api/customers").send({ name: "Carl Client", phone: "+1 512-555-1212", area: "Downtown" });
    expect(created.status).toBe(201);

    const duplicate = await manager.post("/api/customers").send({ name: "Other", phone: "+1 512-555-1212", area: "Downtown" });
    expect(duplicate.status).toBe(409);

    const edited = await manager.patch(`/api/customers/${created.body.customer._id}`).send({ area: "Mueller" });
    expect(edited.body.customer.area).toBe("Mueller");
  });

  it("computes totals over the whole history, not just the listed bookings (bug #12)", async () => {
    const customer = await createCustomer();
    for (let i = 0; i < 55; i += 1) {
      await createBooking({ customer: customer._id, status: "completed", amount: 10 });
    }
    await createTicket({ booking: await createBooking({ customer: customer._id, status: "cancelled", amount: 999 }) });

    const detail = await manager.get(`/api/customers/${customer._id}`);
    expect(detail.body.bookings).toHaveLength(50);
    expect(detail.body.customer).toMatchObject({ totalBookings: 56, totalSpent: 550, totalTickets: 1 });

    const list = await manager.get(`/api/customers?search=${encodeURIComponent(customer.name)}`);
    expect(list.body.items[0]).toMatchObject({ totalBookings: 56, totalSpent: 550 });
  });
});

describe("search", () => {
  it("finds codes by number and respects each role's access", async () => {
    const booking = await createBooking({ code: "BK-4801" });
    await createTicket({ booking, code: "TK-4801", subject: "Leaky pipe" });
    await createCustomer({ name: "Searchable Sarah" });

    const asManager = await manager.get("/api/search?q=4801");
    expect(asManager.body.bookings.map((b) => b.code)).toEqual(["BK-4801"]);
    expect(asManager.body.tickets.map((t) => t.code)).toEqual(["TK-4801"]);

    const finance = await signIn(team.finance);
    const asFinance = await finance.get("/api/search?q=Searchable");
    expect(asFinance.body.customers).toEqual([]);
    const ticketsForFinance = await finance.get("/api/search?q=Leaky");
    expect(ticketsForFinance.body.tickets).toEqual([]);
  });
});
