/**
 * jest.global-setup.js
 *
 * Carga el archivo .env.test antes de que cualquier suite arranque.
 * Usa dotenv (ya disponible como transitive dep de supabase-js).
 */
const path = require('path');

module.exports = async () => {
  require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });
};
