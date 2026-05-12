import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/simon/Facultad/Tercer año/Ingenieria de Software 2/Proyecto/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('reservas').select('*, clases(*)').limit(1);
  console.log("With clases:", JSON.stringify(data, null, 2));
  console.log("Error:", error);

  const { data: data2, error: err2 } = await supabase.from('reservas').select('*, clase(*)').limit(1);
  console.log("With clase:", JSON.stringify(data2, null, 2));
  console.log("Error2:", err2);
}
run();
