import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function testConnection() {
  const connectionString = process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('Error: POSTGRES_URL environment variable is not set');
    return;
  }
  
  console.log('Testing connection to:', connectionString);
  
  try {
    const sql = postgres(connectionString, {
      ssl: { rejectUnauthorized: false }
    });
    
    // Try a simple query
    const result = await sql`SELECT 1 as test`;
    console.log('Connection successful!', result);
    
    await sql.end();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();