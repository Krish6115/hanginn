import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://rmdbvaxfxbnuxmbpgalu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZGJ2YXhmeGJudXhtYnBnYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTU4MTQsImV4cCI6MjA5MzEzMTgxNH0.GsN8A_aPAKy6KDFELWSL2OYBNtooSHhvJWk8GEaCE0A";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVenues() {
  const { data, error } = await supabase
    .from('venues')
    .select('name, lat, lng');

  if (error) {
    console.error('Error fetching venues:', error.message);
    return;
  }

  console.log('Venues in database:');
  data.forEach(v => {
    console.log(`- ${v.name}: ${v.lat}, ${v.lng}`);
  });
}

checkVenues();
