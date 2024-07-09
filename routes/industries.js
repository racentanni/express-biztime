const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

let router = new express.Router();



// POST add a new industr
router.post("/industries", async function (req, res, next) {
    try {
        let { code, industry } = req.body;

        const result = await db.query(
            `INSERT INTO industries (code, industry)
             VALUES ($1, $2)
             RETURNING code, industry`, [code, industry]
        );

        return res.status(201).json({ "industry": result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// GET list of industries with associated company codes
router.get("/industries", async function (req, res, next) {
    try {
        const result = await db.query(
            `SELECT i.code, i.industry, array_agg(ci.comp_code) AS companies
             FROM industries AS i
             LEFT JOIN company_industries AS ci ON i.code = ci.industry_code
             GROUP BY i.code`
        );

        return res.json({ "industries": result.rows });
    } catch (err) {
        return next(err);
    }
});

// POST associate an industry to a company
router.post("/industries/:code", async function (req, res, next) {
    try {
        let industryCode = req.params.code;
        let { comp_code } = req.body;

        const result = await db.query(
            `INSERT INTO company_industries (comp_code, industry_code)
             VALUES ($1, $2)
             RETURNING comp_code, industry_code`, [comp_code, industryCode]
        );

        return res.status(201).json({ "association": result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;