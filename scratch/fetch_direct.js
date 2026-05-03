const supabaseUrl = "https://rmdbvaxfxbnuxmbpgalu.supabase.co/rest/v1/venues?name=ilike.*Third%20Wave*&select=name,lat,lng";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZGJ2YXhmeGJudXhtYnBnYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTU4MTQsImV4cCI6MjA5MzEzMTgxNH0.GsN8A_aPAKy6KDFELWSL2OYBNtooSHhvJWk8GEaCE0A";

async function run() {
  try {
    const res = await fetch(supabaseUrl, {
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`
      }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
