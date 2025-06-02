const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm'; //la clave es de 256 bits/32 bytes    
const KEY = Buffer.from(process.env.DATA_KEY, 'hex'); // Debe ser 32 bytes (64 hex chars)
const IV_LENGTH = 12; // Recomendado para GCM (Modo de operacion Galois/Counter Mode) que añade autenticidad

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH); //vector de inicialización aleatorio
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);  // Crea el cifrador con el algoritmo, la clave y el IV
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();  // Cifra el texto de entrada y se obtiene una etiqueta de autenticidad
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted; // Devuelve el IV, la etiqueta de autenticidad y el texto cifrado concatenados
}

function decrypt(encrypted) {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':'); // Separa el IV, la etiqueta de autenticidad y el texto cifrado
  const iv = Buffer.from(ivHex, 'hex'); // Convierte el IV de hexadecimal a un buffer
  const authTag = Buffer.from(authTagHex, 'hex');  // Convierte la etiqueta de autenticidad de hexadecimal a un buffer
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv); // Crea el descifrador con el mismo algoritmo, clave y IV
  decipher.setAuthTag(authTag); // Establece la etiqueta de autenticidad para verificar la integridad del mensaje
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');  
  decrypted += decipher.final('utf8'); 
  return decrypted; 
}

module.exports = { encrypt, decrypt };
