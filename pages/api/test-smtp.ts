import { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('SMTP Configuration:')
    console.log('Host:', process.env.SMTP_SERVER)
    console.log('Port:', process.env.SMTP_PORT)
    console.log('Username:', process.env.SMTP_USERNAME)
    console.log('Password:', process.env.SMTP_PASSWORD ? '***' : 'NOT SET')
    console.log('From Email:', process.env.FROM_EMAIL)
    console.log('From Name:', process.env.FROM_NAME)

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Test connection
    console.log('Testing SMTP connection...')
    await transporter.verify()
    console.log('SMTP connection verified successfully')

    // Send test email
    const { to } = req.body
    if (!to) {
      return res.status(400).json({ message: 'Email address required' })
    }

    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'Test Email from Archalley Newsletter',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from the Archalley Newsletter system.</p>
        <p>If you receive this, the SMTP configuration is working correctly.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    })

    console.log('Test email sent:', info.messageId)

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
    })
  } catch (error) {
    console.error('SMTP Test Error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    })
  }
}
