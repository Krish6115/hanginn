import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rmdbvaxfxbnuxmbpgalu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZGJ2YXhmeGJudXhtYnBnYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTU4MTQsImV4cCI6MjA5MzEzMTgxNH0.GsN8A_aPAKy6KDFELWSL2OYBNtooSHhvJWk8GEaCE0A";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Starting forced update on Third Wave Coffee venue...");
  
  const { data, error } = await supabase
    .from('venues')
    .update({ 
      lat: 12.9753, 
      lng: 77.6010, 
      radius_meters: 150 
    })
    .eq('id', '13af2c4b-9c3b-4e69-b3cd-8a692fba89ab')
    .select();

  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log("Update successful!");
    console.log("Resulting data:", JSON.stringify(data, null, 2));
  }
}

run();
