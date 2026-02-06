import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM lineups ORDER BY created_at DESC;`;
      return res.status(200).json({
        message: "success",
        data: rows
      });
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
      // Ensure the table exists (This is usually done manually or via migration, but for a simple app we can check/create)
      // Ideally run this once manually, but having it fail gracefully or checking is okay.
      // For this migration, I will assume the user follows the plan to create the table manually, 
      // but to be safe and "one-click" friendly, we could include a check, but standard practice is separate migration.
      // I'll stick to the core logic.
      
      const lineupString = JSON.stringify(lineup);
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
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
