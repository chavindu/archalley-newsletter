// Test script to verify the improved email sending functionality
const nodemailer = require('nodemailer')

// Test the SMTP configuration with the new settings
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_SERVER || 'outlook.office365.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  pool: true,
  maxConnections: 1,
  maxMessages: 100,
  rateLimit: 10,
  rateDelta: 1000,
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
})

async function testEmailSending() {
  console.log('Testing improved email sending configuration...')
  
  try {
    // Verify the connection
    await transporter.verify()
    console.log('✓ SMTP connection verified successfully')
    
    // Test sending a simple email
    const testEmail = {
      from: `"Test" <${process.env.FROM_EMAIL || 'test@example.com'}>`,
      to: process.env.TEST_EMAIL || 'test@example.com',
      subject: 'Test Email - SMTP Fix Verification',
      html: `
        <h2>Email Sending Fix Test</h2>
        <p>This is a test email to verify that the SMTP connection and rate limiting fixes are working correctly.</p>
        <p><strong>Configuration tested:</strong></p>
        <ul>
          <li>Connection pooling enabled</li>
          <li>Max connections limited to 1</li>
          <li>Rate limiting configured</li>
          <li>Proper timeouts set</li>
        </ul>
        <p>If you receive this email, the fix is working!</p>
      `
    }
    
    const info = await transporter.sendMail(testEmail)
    console.log('✓ Test email sent successfully:', info.messageId)
    console.log('✓ Email sending fix is working correctly!')
    
  } catch (error) {
    console.error('✗ Error testing email configuration:', error)
    console.error('Please check your SMTP settings and try again.')
  } finally {
    transporter.close()
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testEmailSending()
}

module.exports = { testEmailSending }
