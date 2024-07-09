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
            comp_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE
        );
    `);
});

beforeEach(async () => {
    await db.query("DELETE FROM companies");
    await db.query("INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple', 'Maker of iPhones')");
});

afterAll(async () => {
    await db.query("DROP TABLE invoices");
    await db.query("DROP TABLE companies");
    await db.end();
});

describe("GET /companies", () => {
    test("Gets a list of companies", async () => {
        const res = await request(app).get("/companies");
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            companies: [{ code: "apple", name: "Apple" }]
        });
    });
});

describe("GET /companies/:code", () => {
    test("Gets a single company by code", async () => {
        const res = await request(app).get("/companies/apple");
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            company: {
                code: "apple",
                name: "Apple",
                description: "Maker of iPhones",
                invoices: []
            }
        });
    });

    test("Responds with 404 for invalid company code", async () => {
        const res = await request(app).get("/companies/invalid");
        expect(res.statusCode).toEqual(404);
    });
});

describe("POST /companies", () => {
    test("Creates a new company", async () => {
        const res = await request(app)
            .post("/companies")
            .send({ code: "ibm", name: "IBM", description: "Big Blue" });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({
            company: { code: "ibm", name: "IBM", description: "Big Blue" }
        });
    });
});

describe("PUT /companies/:code", () => {
    test("Updates a single company", async () => {
        const res = await request(app)
            .put("/companies/apple")
            .send({ name: "Apple Inc", description: "Tech giant" });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            company: { code: "apple", name: "Apple Inc", description: "Tech giant" }
        });
    });

    test("Responds with 404 for invalid company code", async () => {
        const res = await request(app)
            .put("/companies/invalid")
            .send({ name: "Invalid", description: "Invalid company" });
        expect(res.statusCode).toEqual(404);
    });
});

describe("DELETE /companies/:code", () => {
    test("Deletes a single company", async () => {
        const res = await request(app).delete("/companies/apple");
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ status: "deleted" });
    });

    test("Responds with 404 for invalid company code", async () => {
        const res = await request(app).delete("/companies/invalid");
        expect(res.statusCode).toEqual(404);
    });
});
