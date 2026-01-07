// hash-password.mjs
/* this standalone file generates a hashed password */
//run: node hash-password.mjs
import bcrypt from 'bcrypt';

const plainPassword = 'ReplaceWithaStrongPassWord'; // (ReplaceWithaStrongPassWord) Change this to whatever you want the courier's password to be
const saltRounds = 10;

try {
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    console.log('Hashed password:');
    console.log(hash);
} catch (err) {
    console.error('Error hashing password:', err);
}