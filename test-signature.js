// test-signature.js
const crypto = require('crypto');

const secret = process.env.LS_WEBHOOK_SECRET || 'notenook_secret_2024_xyz!';
const payload = JSON.stringify({
  meta: {
    event_name: 'subscription_created',
    custom_data: { user_id: '123' }
  }
});

const hmac = crypto.createHmac('sha256', secret);
const digest = Buffer.from(hmac.update(payload).digest('hex'), 'utf8');

console.log('Test Payload Signature:', digest.toString());
