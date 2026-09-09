import dotenv from 'dotenv';
import { sendAnniversaryEmail } from '../services/emailService.js';

dotenv.config();

async function testAnniversaryEmail() {
  console.log('Testing anniversary email...\n');

  try {
    const result = await sendAnniversaryEmail(
      'Test Customer',
      'monteronaroljune@gmail.com',
      'birthday',
      '2024-01-15'
    );

    if (result.success) {
      console.log('✅ Anniversary email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('\nPlease check your Gmail inbox for the anniversary email.\n');
    } else {
      console.log('❌ Failed to send anniversary email');
      console.log('Error:', result.error);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing anniversary email:', error);
    process.exit(1);
  }
}

testAnniversaryEmail();