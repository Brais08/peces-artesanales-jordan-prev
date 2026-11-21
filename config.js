/* Configuración pública de la tienda.
   La URL y la clave "publishable" de Supabase son públicas por diseño: solo permiten
   lo que autorizan las reglas de seguridad (RLS) de la base de datos.
   ⚠️ NUNCA pongas aquí la clave secreta (sb_secret_…) ni la "service_role". */
window.JN_CONFIG = Object.freeze({
  supabaseUrl: 'https://japugfszhiamhevfbacl.supabase.co',
  supabaseKey: 'sb_publishable_DlmFJHzTpZxCVJ4zlHnX5A_pSuQbyiV',
  photoBucket: 'product-photos'
});
