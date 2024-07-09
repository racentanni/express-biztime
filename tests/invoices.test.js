const request = require("supertest");
const app = require("../app"); // assuming your Express app is exported from app.js
const db = require("../db");

beforeAll(async () => {
    await db.query(`
        CREATE TABLE companies (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT
        );
    `);
    await db.query(`
        CREATE TABLE invoices (
            id SERIAL PRIMARY KEY,
            comp_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
            amt NUMERIC NOT NULL,
            paid BOOLEAN DEFAULT false NOT NULL,
            add_date DATE DEFAULT CURRENT_DATE NOT NULL,
            paid_date DATE
        );
    `);
});

beforeEach(async () => {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
    await db.query("INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple', 'Maker of iPhones')");
    await db.query("INSERT INTO invoices (comp_code, amt) VALUES ('apple', 100)");
});

afterAll(async () => {
    await db.query("DROP TABLE invoices");
    await db.query("DROP TABLE companies");
    await db.end();
});

describe("GET /invoices", () => {
    test("Gets a list of invoices", async () => {
        const res = await request(app).get("/invoices");
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            invoices: [{ id: expect.any(Number), comp_code: "apple" }]
        });
    });
});

describe("GET /invoices/:id", () => {
    test("Gets a single invoice by id", async () => {
        const res = await request(app).get("/invoices/1");
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            invoice: {
                id: 1,
                company: {
                    code: "apple",
                    name: "Apple",
                    description: "Maker of iPhones",
                },
                amt: 100,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });

    test("Responds with 404 for invalid invoice id", async () => {
        const res = await request(app).get("/invoices/999");
        expect(res.statusCode).toEqual(404);
    });
});

describe("POST /invoices", () => {
    test("Creates a new invoice", async () => {
        const res = await request(app)
            .post("/invoices")
            .send({ comp_code: "apple", amt: 200 });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: "apple",
                amt: 200,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });
});

describe("PUT /invoices/:id", () => {
    test("Updates a single invoice", async () => {
        const res = await request(app)
            .put("/invoices/1")
            .send({ amt: 300, paid: true });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            invoice: {
                id: 1,
                comp_code: "apple",
                amt: 300,
                paid: true,
                add_date: expect.any(String),
                paid_date: expect.any(String)
            }
        });
    });

    test("Responds with 404 for invalid invoice id", async () => {
        const res = await request(app)
            .put("/invoices/999")
            .send({ amt: 300, paid: true });
        expect(res.statusCode).toEqual(404);
    });
});

describe("DELETE /invoices/:id", () => {
    test("Deletes a single invoice", async () => {
        const res = await request(app).delete("/invoices/1");
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ status: "deleted" });
    });

    test("Responds with 404 for invalid invoice id", async () => {
        const res = await request(app).delete("/invoices/999");
        expect(res.statusCode).toEqual(404);
    });
});
