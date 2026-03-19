import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Testing vista_empleados...');
  const { data: ve, error: vee } = await supabase.from('vista_empleados').select('*').limit(1);
  console.log('Vista Empleados:', vee || (ve && ve.length > 0 ? Object.keys(ve[0]) : 'Empty'));

  console.log('\nTesting vista_tecnicos...');
  const { data: vt, error: vte } = await supabase.from('vista_tecnicos').select('*').limit(1);
  console.log('Vista Tecnicos:', vte || (vt && vt.length > 0 ? Object.keys(vt[0]) : 'Empty'));

  console.log('\nTesting vista_centros_servicio ...');
  const { data: c, error: ce } = await supabase.from('vista_centros_servicio').select('*').limit(1);
  console.log('Vista Centros Servicio:', ce || (c && c.length > 0 ? Object.keys(c[0]) : 'Empty'));

  console.log('\nTesting centros_servicio ...');
  const { data: c2, error: c2e } = await supabase.from('centros_servicio').select('*').limit(1);
  console.log('Centros Servicio:', c2e || (c2 && c2.length > 0 ? Object.keys(c2[0]) : 'Empty'));

  console.log('\nTesting tecnicos ...');
  const { data: t, error: te } = await supabase.from('tecnicos').select('*').limit(1);
  console.log('Tecnicos:', te || (t && t.length > 0 ? Object.keys(t[0]) : 'Empty'));
}

check();
