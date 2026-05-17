const postgres = require('postgres');
require('dotenv').config({path: '.env.local'});
const client = postgres(process.env.DATABASE_URL);
async function run() {
  const res = await client`SELECT id, email, nama_panggilan FROM profiles`;
  console.log(res);
  client.end();
}
run();
