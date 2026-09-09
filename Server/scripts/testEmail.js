import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

async function testEmail() {
  console.log('Testing Gmail SMTP connection...\n');
  console.log('Email configuration:');
  console.log('  Host:', process.env.EMAIL_HOST);
  console.log('  Port:', process.env.EMAIL_PORT);
  console.log('  User:', process.env.EMAIL_USER);
  console.log('  From:', process.env.EMAIL_FROM);
  console.log('');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Send test email
    console.log('Sending test email...');
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: 'monteronaroljune@gmail.com',
      subject: 'Test Email - FMG Catering System',
      html: `
        <h1>Test Email Successful!</h1>
        <p>This is a test email from the FMG Catering System.</p>
        <p>If you received this, your Gmail SMTP is working correctly.</p>
        <p>Sender: ${process.env.EMAIL_FROM}</p>
        <p>Recipient: monteronaroljune@gmail.com</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\nPlease check your Gmail inbox for the test email.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing email:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

testEmail();