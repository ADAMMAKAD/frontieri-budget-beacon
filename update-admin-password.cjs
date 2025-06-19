require('dotenv').config({ path: './backend/.env' });
const bcrypt = require('bcryptjs');
const pool = require('./backend/config/database');

const NEW_PASSWORD = 'newadminpassword123'; // Choose a strong password
const ADMIN_EMAIL = 'admin@test.com';

async function updateAdminPassword() {
  try {
    console.log(`Attempting to update password for ${ADMIN_EMAIL}...`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 12);
    console.log('New password hashed.');

    // Update the user's password in the database
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email',
      [hashedPassword, ADMIN_EMAIL]
    );

    if (result.rowCount > 0) {
      console.log(`Successfully updated password for ${result.rows[0].email}.`);
      console.log(`You can now log in with email: ${ADMIN_EMAIL} and password: ${NEW_PASSWORD}`);
    } else {
      console.error(`Error: Admin user ${ADMIN_EMAIL} not found.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin password:', error);
    process.exit(1);
  }
}

updateAdminPassword();