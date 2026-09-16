import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { execute } from '../config/dbHelper.js';

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports (587 uses STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates (for development)
    }
  });
}

// Email transport (rebuildable after settings changes)
let transporter = createTransporter();

export function reloadTransporter() {
  transporter = createTransporter();
}

// Masked SMTP settings for the admin email config screen
export function getEmailSettings() {
  return {
    host: process.env.EMAIL_HOST || '',
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    from: process.env.EMAIL_FROM || '',
    configured: Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS),
  };
}

// Apply SMTP settings at runtime and rebuild the transporter
export function applyEmailSettings({ host, port, user, pass, from } = {}) {
  if (host !== undefined) process.env.EMAIL_HOST = host;
  if (port !== undefined) process.env.EMAIL_PORT = String(port);
  if (user !== undefined) process.env.EMAIL_USER = user;
  if (pass !== undefined) process.env.EMAIL_PASS = pass;
  if (from !== undefined) process.env.EMAIL_FROM = from;
  reloadTransporter();
}

// Generate personalized greeting based on event type
function generateGreeting(customerName, eventType) {
  const greetings = {
    'birthday': `Happy birthday, ${customerName}!`,
    'wedding': `Happy anniversary, ${customerName}!`,
    'corporate': `Greetings, ${customerName}!`,
    'debut': `Happy debut anniversary, ${customerName}!`,
    'christening': `Happy christening anniversary, ${customerName}!`,
    'default': `Hello, ${customerName}!`
  };

  const eventTypeLower = eventType?.toLowerCase() || '';
  return greetings[eventTypeLower] || greetings.default;
}

// Generate advertisement content
function generateAdvertisementContent(eventType) {
  const advertisements = {
    'birthday': `It's been a year since your wonderful birthday celebration with FMG Catering! We hope your special day was filled with joy and delicious memories. As you plan your next celebration, remember that FMG Catering is here to make it even more special with our exceptional culinary services and attentive staff.`,
    'wedding': `Celebrating one year since your beautiful wedding day! Your wedding was a perfect blend of love, joy, and exceptional cuisine. As you reflect on your special day, consider FMG Catering for your future celebrations - from anniversaries to family gatherings, we're committed to making every moment memorable.`,
    'corporate': `A year has passed since your successful corporate event! Your business gathering was a testament to professional excellence and great hospitality. For your next corporate function, meeting, or company celebration, trust FMG Catering to deliver the same level of quality and service that made your last event a success.`,
    'debut': `Happy debut anniversary! Your coming-of-age celebration was a beautiful milestone, and we were honored to be part of it. As you continue to celebrate life's special moments, FMG Catering is ready to create unforgettable experiences with our exquisite menus and impeccable service.`,
    'christening': `Happy christening anniversary! Your baby's special day was filled with blessings and joy. As your little one grows, FMG Catering would be delighted to be part of future family celebrations - from birthdays to milestones, we're here to make every occasion special.`,
    'default': `It's been a year since your wonderful event with FMG Catering! We hope your celebration was everything you imagined and more. As you plan your next special occasion, remember that FMG Catering is dedicated to creating memorable experiences with exceptional food and outstanding service.`
  };

  const eventTypeLower = eventType?.toLowerCase() || '';
  return advertisements[eventTypeLower] || advertisements.default;
}

// Log email to database
async function logEmailToDatabase(recipientEmail, emailType, subject, status, errorMessage = null) {
  try {
    await execute(
      `INSERT INTO EmailLogs (recipient_email, email_type, subject, status, error_message)
       VALUES (?, ?, ?, ?, ?)`,
      [recipientEmail, emailType, subject, status, errorMessage]
    );
  } catch (error) {
    console.error('Error logging email to database:', error);
  }
}

// Send anniversary/retention email
export async function sendAnniversaryEmail(customerName, customerEmail, eventType, eventDate) {
  try {
    const greeting = generateGreeting(customerName, eventType);
    const advertisement = generateAdvertisementContent(eventType);

    const subject = `${greeting} - Celebrating Your Special Day with FMG Catering`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Anniversary Greeting from FMG Catering</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #C9A227 0%, #D4AF37 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 8px; margin-top: 20px; }
          .greeting { font-size: 24px; color: #C9A227; font-weight: bold; margin-bottom: 20px; }
          .message { font-size: 16px; margin-bottom: 20px; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
          .cta-button { display: inline-block; background: #C9A227; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .cta-button:hover { background: #B8922A; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FMG Catering</h1>
            <p>Creating Unforgettable Celebrations</p>
          </div>
          <div class="content">
            <p class="greeting">${greeting}</p>
            <p class="message">${advertisement}</p>
            <p>Whether it's a birthday, wedding, corporate event, or any special occasion, our team is dedicated to making your celebration truly exceptional with:</p>
            <ul>
              <li>Exquisite culinary creations</li>
              <li>Professional and attentive service</li>
              <li>Customized menu planning</li>
              <li>Seamless event coordination</li>
            </ul>
            <p>We would be honored to be part of your next celebration. Contact us today to discuss how we can make your special day even more memorable!</p>
            <p style="text-align: center;">
              <a href="${CLIENT_URL}" class="cta-button">Plan Your Next Celebration</a>
            </p>
          </div>
          <div class="footer">
            <p>FMG Catering | Cebu, Philippines</p>
            <p>Email: bookings@fmgcatering.com | Phone: +63 32 123 4567</p>
            <p>This email was sent because you had an event with us on ${new Date(eventDate).toLocaleDateString()}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Anniversary email sent successfully:', info.messageId);

    // Log successful email
    await logEmailToDatabase(customerEmail, 'anniversary_reminder', subject, 'sent');

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending anniversary email:', error);
    
    // Log failed email
    await logEmailToDatabase(customerEmail, 'anniversary_reminder', subject, 'failed', error.message);
    
    return { success: false, error: error.message };
  }
}

// Send booking confirmation email
export async function sendBookingConfirmationEmail(customerName, customerEmail, bookingRef, eventType, eventDate) {
  try {
    const subject = `Booking Confirmation - ${bookingRef} | FMG Catering`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation - FMG Catering</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #C9A227 0%, #D4AF37 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 8px; margin-top: 20px; }
          .confirmation { font-size: 20px; color: #C9A227; font-weight: bold; margin-bottom: 20px; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .details p { margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FMG Catering</h1>
            <p>Booking Confirmed</p>
          </div>
          <div class="content">
            <p class="confirmation">Thank you for choosing FMG Catering!</p>
            <p>Dear ${customerName},</p>
            <p>We are pleased to confirm your booking. Your event details have been received and our team will review your request shortly.</p>
            
            <div class="details">
              <p><strong>Booking Reference:</strong> ${bookingRef}</p>
              <p><strong>Event Type:</strong> ${eventType}</p>
              <p><strong>Event Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
            </div>
            
            <p>Our team will contact you within 24-48 hours to discuss your requirements and confirm all details.</p>
            <p>If you have any questions or need to make changes, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>FMG Catering | Cebu, Philippines</p>
            <p>Email: bookings@fmgcatering.com | Phone: +63 32 123 4567</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Booking confirmation email sent successfully:', info.messageId);

    // Log successful email
    await logEmailToDatabase(customerEmail, 'booking_confirmation', subject, 'sent');

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    
    // Log failed email
    await logEmailToDatabase(customerEmail, 'booking_confirmation', subject, 'failed', error.message);
    
    return { success: false, error: error.message };
  }
}

// Send booking approval email
export async function sendBookingApprovalEmail(customerName, customerEmail, bookingRef, eventType, eventDate) {
  try {
    const subject = `Booking Approved - ${bookingRef} | FMG Catering`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Approved - FMG Catering</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 8px; margin-top: 20px; }
          .approval { font-size: 20px; color: #10B981; font-weight: bold; margin-bottom: 20px; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FMG Catering</h1>
            <p>Booking Approved</p>
          </div>
          <div class="content">
            <p class="approval">Great news, ${customerName}!</p>
            <p>Your booking has been approved and we're excited to be part of your special celebration.</p>
            
            <div class="details">
              <p><strong>Booking Reference:</strong> ${bookingRef}</p>
              <p><strong>Event Type:</strong> ${eventType}</p>
              <p><strong>Event Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
            </div>
            
            <p>Our team will be in touch soon to finalize all the details and ensure your event is perfect.</p>
            <p>If you have any questions, please feel free to contact us.</p>
          </div>
          <div class="footer">
            <p>FMG Catering | Cebu, Philippines</p>
            <p>Email: bookings@fmgcatering.com | Phone: +63 32 123 4567</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Booking approval email sent successfully:', info.messageId);

    // Log successful email
    await logEmailToDatabase(customerEmail, 'booking_approval', subject, 'sent');

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking approval email:', error);
    
    // Log failed email
    await logEmailToDatabase(customerEmail, 'booking_approval', subject, 'failed', error.message);
    
    return { success: false, error: error.message };
  }
}

// Send booking rejection email
export async function sendBookingRejectionEmail(customerName, customerEmail, bookingRef, eventType, eventDate) {
  try {
    const subject = `Booking Update - ${bookingRef} | FMG Catering`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Update - FMG Catering</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 8px; margin-top: 20px; }
          .message { font-size: 16px; margin-bottom: 20px; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .details p { margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FMG Catering</h1>
            <p>Booking Update</p>
          </div>
          <div class="content">
            <p>Hello ${customerName},</p>
            <p>We have reviewed your booking request and unfortunately we are unable to accept it at this time.</p>

            <div class="details">
              <p><strong>Booking Reference:</strong> ${bookingRef}</p>
              <p><strong>Event Type:</strong> ${eventType}</p>
              <p><strong>Event Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
            </div>

            <p>Please contact us if your event details changed or if you would like to discuss alternative arrangements. We would love to help you plan your celebration.</p>
            <p>If you have any questions, please don't hesitate to reach out to our team.</p>
          </div>
          <div class="footer">
            <p>FMG Catering | Cebu, Philippines</p>
            <p>Email: bookings@fmgcatering.com | Phone: +63 32 123 4567</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Booking rejection email sent successfully:', info.messageId);

    // Log successful email
    await logEmailToDatabase(customerEmail, 'booking_rejected', subject, 'sent');

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking rejection email:', error);

    // Log failed email
    await logEmailToDatabase(customerEmail, 'booking_rejected', subject, 'failed', error.message);

    return { success: false, error: error.message };
  }
}

// Send promotional campaign email
export async function sendPromotionalEmail(subject, html, recipientEmail, recipientName = '') {
  try {
    const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
    const fullHtml = html || `<p>${greeting}</p><p>Thank you for choosing FMG Catering.</p>`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: subject,
      html: fullHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Promotional email sent successfully:', info.messageId);

    // Log successful email
    await logEmailToDatabase(recipientEmail, 'promotional', subject, 'sent');

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending promotional email:', error);

    // Log failed email
    await logEmailToDatabase(recipientEmail, 'promotional', subject, 'failed', error.message);

    return { success: false, error: error.message };
  }
}

export default {
  sendAnniversaryEmail,
  sendBookingConfirmationEmail,
  sendBookingApprovalEmail,
  sendBookingRejectionEmail,
  sendPromotionalEmail,
  getEmailSettings,
  applyEmailSettings,
  reloadTransporter,
};