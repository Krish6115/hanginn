import fs from 'fs';

async function run() {
  const url = "https://rmdbvaxfxbnuxmbpgalu.supabase.co/rest/v1/venues?select=name,lat,lng";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZGJ2YXhmeGJudXhtYnBnYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTU4MTQsImV4cCI6MjA5MzEzMTgxNH0.GsN8A_aPAKy6KDFELWSL2OYBNtooSHhvJWk8GEaCE0A";

  try {
    const res = await fetch(url, {
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`
      }
    });
    const data = await res.json();
    const filtered = data.filter(v => v.lat !== null && v.lng !== null);
    fs.writeFileSync('scratch/venues_with_data.txt', JSON.stringify(filtered, null, 2));
    console.log(`Found ${filtered.length} venues with coordinates.`);
  } catch (err) {
    fs.writeFileSync('scratch/venues_with_data.txt', 'Error: ' + err.message);
  }
}

run();
