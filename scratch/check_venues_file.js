import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = "https://rmdbvaxfxbnuxmbpgalu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZGJ2YXhmeGJudXhtYnBnYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTU4MTQsImV4cCI6MjA5MzEzMTgxNH0.GsN8A_aPAKy6KDFELWSL2OYBNtooSHhvJWk8GEaCE0A";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVenues() {
  const { data, error } = await supabase
    .from('venues')
    .select('name, lat, lng');

  if (error) {
    fs.writeFileSync('scratch/venues_output.txt', 'Error: ' + error.message);
    return;
  }

  let output = 'Venues in database:\n';
  data.forEach(v => {
    output += `- ${v.name}: ${v.lat}, ${v.lng}\n`;
  });
  fs.writeFileSync('scratch/venues_output.txt', output);
}

checkVenues();
