const webpush = require('web-push');

// Genera nuove chiavi VAPID
const vapidKeys = webpush.generateVAPIDKeys();

console.log('=======================================');
console.log('NUOVE CHIAVI VAPID GENERATE');
console.log('=======================================');
console.log('Chiave Pubblica:');
console.log(vapidKeys.publicKey);
console.log('\nChiave Privata:');
console.log(vapidKeys.privateKey);
console.log('=======================================');
console.log('Aggiungi queste chiavi al file .env o direttamente nel codice');
console.log('======================================='); 