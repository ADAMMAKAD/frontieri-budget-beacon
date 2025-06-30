const bcrypt = require('bcryptjs');

const hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm';
const password = 'password';

bcrypt.compare(password, hash).then(result => {
    console.log('Password "password" matches hash:', result);
});

bcrypt.compare('admin123', hash).then(result => {
    console.log('Password "admin123" matches hash:', result);
});

bcrypt.compare('TempPassword123!', hash).then(result => {
    console.log('Password "TempPassword123!" matches hash:', result);
});