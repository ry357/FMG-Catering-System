import nodemailer from 'nodemailer';

async function setupEmailAccount() {
  console.log('Creating Ethereal Email test account...');
  
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('\n=== EMAIL TEST ACCOUNT CREATED ===');
    console.log('Add these credentials to your Server/.env file:\n');
    console.log(`EMAIL_HOST=smtp.ethereal.email`);
    console.log(`EMAIL_PORT=587`);
    console.log(`EMAIL_USER=${testAccount.user}`);
    console.log(`EMAIL_PASS=${testAccount.pass}`);
    console.log(`EMAIL_FROM=FMG Catering <noreply@fmgcatering.com>`);
    console.log('\nYou can view sent emails at: ' + testAccount.web);
    console.log('===============================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test account:', error);
    process.exit(1);
  }
}

setupEmailAccount();