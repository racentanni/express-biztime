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
        CREATE TABLE industries (
            code TEXT PRIMARY KEY,
            industry TEXT NOT NULL
        );
    `);
    await db.query(`
        CREATE TABLE company_industries (
            comp_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
            industry_code TEXT NOT NULL REFERENCES industries ON DELETE CASCADE,
            PRIMARY KEY (comp_code, industry_code)
        );
    `);
});

beforeEach(async () => {
    await db.query("DELETE FROM company_industries");
    await db.query("DELETE FROM industries");
    await db.query("DELETE FROM companies");
    await db.query("INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple', 'Maker of iPhones')");
    await db.query("INSERT INTO industries (code, industry) VALUES ('tech', 'Technology')");
    await db.query("INSERT INTO company_industries (comp_code, industry_code) VALUES ('apple', 'tech')");
});

afterAll(async () => {
    await db.query("DROP TABLE company_industries");
    await db.query("DROP TABLE industries");
    await db.query("DROP TABLE companies");
    await db.end();
});

describe("GET /companies/:code", () => {
    test("Gets a single company with industries", async () => {
        const res = await request(app).get("/companies/apple");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: {
                code: "apple",
                name: "Apple",
                description: "Maker of iPhones",
                invoices: [],
                industries: ["Technology"]
            }
        });
    });
});

describe("POST /industries", () => {
    test("Creates a new industry", async () => {
        const res = await request(app)
            .post("/industries")
            .send({ code: "acct", industry: "Accounting" });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            industry: { code: "acct", industry: "Accounting" }
        });
    });
});

describe("GET /industries", () => {
    test("Gets a list of industries with company codes", async () => {
        const res = await request(app).get("/industries");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            industries: [{
                code: "tech",
                industry: "Technology",
                companies: ["apple"]
            }]
        });
    });
});

describe("POST /industries/:code", () => {
    test("Associates an industry to a company", async () => {
        const res = await request(app)
            .post("/industries/tech")
            .send({ comp_code: "apple" });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            association: { comp_code: "apple", industry_code: "tech" }
        });
    });
});
