import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { name, email } = req.query;

        try {
            if (name && email) {
                // Search mode
                const { rows } = await sql`
          SELECT * FROM lineups 
          WHERE name = ${name} AND email = ${email}
          ORDER BY created_at DESC 
          LIMIT 1;
        `;

                if (rows.length > 0) {
                    return res.status(200).json({ found: true, data: rows[0] });
                } else {
                    return res.status(200).json({ found: false });
                }
            } else {
                // List all mode (exclude email for privacy)
                const { rows } = await sql`SELECT id, name, lineup, created_at FROM lineups ORDER BY created_at DESC;`;
                return res.status(200).json({
                    message: "success",
                    data: rows
                });
            }
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    if (req.method === 'POST') {
        const { name, email, lineup } = req.body;
        if (!name || !lineup) {
            return res.status(400).json({ error: "Name and lineup are required" });
        }

        try {
            const lineupString = JSON.stringify(lineup);

            // Check for existing record to Upsert
            const existing = await sql`
        SELECT id FROM lineups 
        WHERE name = ${name} AND email = ${email}
        LIMIT 1;
      `;

            if (existing.rows.length > 0) {
                // Update existing record
                const id = existing.rows[0].id;
                await sql`
          UPDATE lineups 
          SET lineup = ${lineupString}, created_at = NOW() 
          WHERE id = ${id};
        `;
                return res.status(200).json({
                    message: "updated",
                    data: req.body,
                    id: id
                });
            } else {
                // Insert new record
                const result = await sql`
          INSERT INTO lineups (name, email, lineup)
          VALUES (${name}, ${email}, ${lineupString})
          RETURNING id;
        `;
                return res.status(200).json({
                    message: "success",
                    data: req.body,
                    id: result.rows[0].id
                });
            }

        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
