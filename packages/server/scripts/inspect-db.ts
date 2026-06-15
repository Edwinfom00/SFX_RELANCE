import "dotenv/config";
import sql from "mssql";

async function main() {
  const brainOpxDb = process.env.BRAINOPX_DATABASE ?? "BopxFMT";
  console.log(`Connecting to database ${brainOpxDb}...`);

  const pool = await sql.connect({
    server:   "localhost",
    database: brainOpxDb,
    user:     process.env.DB_USER     ?? "prisma_user",
    password: process.env.DB_PASSWORD ?? "Prisma@2024!Strong",
    options:  { trustServerCertificate: true, encrypt: false },
  });

  console.log("\n--- Testing Join Query ---");
  const query = `
    SELECT 
      v.quotation_id, 
      v.libelle, 
      v.client_code, 
      v.client_email, 
      v.client_language, 
      v.transmission_date, 
      v.transport_type,
      ag.[Site] AS pays_code,
      ag.[Branche] AS agence_code
    FROM [${brainOpxDb}].[dbo].[v_sfx_active_quotations] v
    INNER JOIN [${brainOpxDb}].[dbo].[tn_Pieces] p ON v.quotation_id = p.[Num Piece]
    INNER JOIN [${brainOpxDb}].[dbo].[tn_Agences] ag ON p.Agence = ag.[Code Agence]
  `;
  
  const result = await pool.request().query(query);
  console.log(result.recordset);

  await pool.close();
}

main().catch(console.error);
