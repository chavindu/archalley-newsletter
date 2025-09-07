import nodemailer from 'nodemailer'
import { stripHtmlTags } from './wordpress'

export interface EmailPost {
  id: number
  title: string
  excerpt: string
  link: string
  featured_image: string | null
  categories: string[]
  date: string
}

export interface EmailConfig {
  to: string
  subject: string
  posts: EmailPost[]
  unsubscribeToken: string
  newsletterId?: string
  subscriberEmail?: string
}

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Generate newsletter HTML template
export function generateNewsletterHTML(posts: EmailPost[], unsubscribeToken: string, newsletterId?: string, subscriberEmail?: string): string {
  const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/unsubscribe?token=${unsubscribeToken}`
  
  // Generate tracking pixel URL
  const trackingPixelUrl = newsletterId && subscriberEmail 
    ? `${process.env.NEXTAUTH_URL}/api/track/open?newsletterId=${newsletterId}&email=${encodeURIComponent(subscriberEmail)}`
    : ''
  
  // Helper function to wrap links with click tracking
  const wrapLinkWithTracking = (url: string, linkText: string) => {
    if (!newsletterId || !subscriberEmail) {
      return `<a href="${url}">${linkText}</a>`
    }
    const trackedUrl = `${process.env.NEXTAUTH_URL}/api/track/click?newsletterId=${newsletterId}&email=${encodeURIComponent(subscriberEmail)}&url=${encodeURIComponent(url)}`
    return `<a href="${trackedUrl}">${linkText}</a>`
  }
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Archalley Newsletter</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            max-width: 100%;
        }
        
        /* Main styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
            width: 100% !important;
            min-width: 100%;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            width: 100%;
        }
        
        .header {
            background-color: #FFA500;
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        
        .logo-img {
            max-width: 200px;
            height: auto;
            margin: 0 auto 10px auto;
            display: block;
        }
        
        .tagline {
            font-size: 14px;
            margin: 5px 0 0 0;
            color: white;
        }
        
        .content {
            padding: 30px 20px;
        }
        
        .post-card {
            margin-bottom: 30px;
            background: white;
            border: 1px solid #e0e0e0;
        }
        
        .post-card:last-child {
            margin-bottom: 0;
        }
        
        .post-content-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .post-text-cell {
            padding: 25px;
            vertical-align: top;
            width: 60%;
        }
        
        .post-image-cell {
            padding: 0;
            vertical-align: top;
            width: 40%;
            background: #f8f9fa;
            line-height: 0;
            font-size: 0;
        }
        
        .post-image {
            width: 100%;
            height: 200px;
            display: block;
            object-fit: cover;
            object-position: center;
        }
        
        .post-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin: 0 0 10px 0;
            text-decoration: none;
            line-height: 1.3;
        }
        
        .post-title a {
            color: #333;
            text-decoration: none;
        }
        
        .post-meta {
            margin-bottom: 15px;
        }
        
        .post-date {
            color: #666;
            font-size: 14px;
        }
        
        .post-excerpt {
            color: #555;
            font-size: 14px;
            margin-bottom: 15px;
            line-height: 1.5;
        }
        
        .read-more {
            display: inline-block;
            background-color: #FFA500;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            font-weight: bold;
            font-size: 14px;
        }
        
        .read-more:hover {
            background-color: #e69500;
        }
        
        .footer {
            background-color: #333;
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        
        .footer p {
            margin: 5px 0;
            font-size: 14px;
        }
        
        .footer a {
            color: #FFA500;
            text-decoration: none;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            text-decoration: none;
        }
        
        .social-icon-img {
            width: 32px;
            height: 32px;
            display: block;
        }
        
        .unsubscribe {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #555;
        }
        
        /* Mobile styles */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }
            .header {
                padding: 20px 15px;
            }
            .content {
                padding: 20px 15px;
            }
            .post-text-cell {
                padding: 20px;
                width: 100% !important;
                display: block !important;
            }
            .post-image-cell {
                width: 100% !important;
                display: block !important;
            }
            .post-image {
                height: 150px;
                object-fit: cover;
                object-position: center;
            }
            .post-title {
                font-size: 18px;
            }
            .logo-img {
                max-width: 150px;
                margin: 0 auto 10px auto;
                display: block;
            }
        }
        
        /* Gmail specific fixes */
        .gmail-fix {
            display: none;
            display: none !important;
        }
        
        /* Gmail mobile fixes */
        @media screen and (max-width: 600px) {
            .post-content-table {
                width: 100% !important;
            }
            .post-text-cell, .post-image-cell {
                display: block !important;
                width: 100% !important;
            }
        }
        
        /* Gmail dark mode fixes */
        @media (prefers-color-scheme: dark) {
            .post-card {
                background-color: #ffffff !important;
                color: #000000 !important;
            }
            .post-title, .post-excerpt, .post-date {
                color: #000000 !important;
            }
        }
        
        /* Outlook specific fixes */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
            .container {
                max-width: 600px !important;
            }
        }
        
        /* Force Gmail to respect table widths */
        .post-content-table[class="post-content-table"] {
            width: 100% !important;
        }
        
        /* Gmail image fixes */
        .post-image[class="post-image"] {
            width: 100% !important;
            height: 200px !important;
            object-fit: cover !important;
            object-position: center !important;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${process.env.NEXTAUTH_URL}/images/archalley-logo.png" alt="Archalley" class="logo-img" />
            <p class="tagline">Architecture & Design Newsletter</p>
        </div>
        
        <div class="content">
            ${posts.map((post, index) => `
                <div class="post-card">
                    <table class="post-content-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%;">
                        <tr>
                            ${index % 2 === 0 ? `
                            <td class="post-text-cell" width="60%" style="width: 60%;">
                                <h2 class="post-title">${wrapLinkWithTracking(post.link, post.title)}</h2>
                                <div class="post-meta">
                                    <span class="post-date">${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <p class="post-excerpt">${post.excerpt}</p>
                                ${wrapLinkWithTracking(post.link, '<span class="read-more">Read Full Article</span>')}
                            </td>
                            <td class="post-image-cell" width="40%" style="width: 40%;">
                                ${post.featured_image ? `
                                    <img src="${post.featured_image}" alt="${post.title}" class="post-image">
                                ` : `
                                    <div style="color: #ccc; font-size: 14px; text-align: center; padding: 50px 20px;">No Image</div>
                                `}
                            </td>
                            ` : `
                            <td class="post-image-cell" width="40%" style="width: 40%;">
                                ${post.featured_image ? `
                                    <img src="${post.featured_image}" alt="${post.title}" class="post-image">
                                ` : `
                                    <div style="color: #ccc; font-size: 14px; text-align: center; padding: 50px 20px;">No Image</div>
                                `}
                            </td>
                            <td class="post-text-cell" width="60%" style="width: 60%;">
                                <h2 class="post-title">${wrapLinkWithTracking(post.link, post.title)}</h2>
                                <div class="post-meta">
                                    <span class="post-date">${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <p class="post-excerpt">${post.excerpt}</p>
                                ${wrapLinkWithTracking(post.link, '<span class="read-more">Read Full Article</span>')}
                            </td>
                            `}
                        </tr>
                    </table>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p><strong>Archalley</strong> - Your source for architecture and design inspiration</p>
            <p>Visit us at <a href="https://archalley.com">archalley.com</a></p>
            
            <div class="social-links">
                <a href="https://web.facebook.com/archalley" title="Facebook">
                    <img src="${process.env.NEXTAUTH_URL}/images/facebook.png" alt="Facebook" class="social-icon-img" />
                </a>
                <a href="https://www.instagram.com/archalley_insta/" title="Instagram">
                    <img src="${process.env.NEXTAUTH_URL}/images/instagram.png" alt="Instagram" class="social-icon-img" />
                </a>
                <a href="https://www.youtube.com/@archalleytube" title="YouTube">
                    <img src="${process.env.NEXTAUTH_URL}/images/youtube.png" alt="YouTube" class="social-icon-img" />
                </a>
                <a href="https://www.tiktok.com/@archalley.com" title="TikTok">
                    <img src="${process.env.NEXTAUTH_URL}/images/tiktok.png" alt="TikTok" class="social-icon-img" />
                </a>
                <a href="https://www.pinterest.com/archalleypins/" title="Pinterest">
                    <img src="${process.env.NEXTAUTH_URL}/images/pinterest.png" alt="Pinterest" class="social-icon-img" />
                </a>
                <a href="https://www.linkedin.com/company/archalleypage/" title="LinkedIn">
                    <img src="${process.env.NEXTAUTH_URL}/images/linkedin.png" alt="LinkedIn" class="social-icon-img" />
                </a>
                <a href="https://x.com/archalley" title="X (Twitter)">
                    <img src="${process.env.NEXTAUTH_URL}/images/x.png" alt="X (Twitter)" class="social-icon-img" />
                </a>
            </div>
            
            <div class="unsubscribe">
                <p>Don't want to receive these emails anymore?</p>
                <p><a href="${unsubscribeUrl}">Unsubscribe here</a></p>
            </div>
        </div>
    </div>
    ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />` : ''}
</body>
</html>
  `.trim()
}

// Send newsletter email
export async function sendNewsletterEmail(config: EmailConfig): Promise<boolean> {
  try {
    console.log(`Attempting to send email to: ${config.to}`)
    console.log('SMTP Config:', {
      host: process.env.SMTP_SERVER,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USERNAME,
      from: process.env.FROM_EMAIL
    })

    const html = generateNewsletterHTML(config.posts, config.unsubscribeToken, config.newsletterId, config.subscriberEmail)
    
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: config.to,
      subject: config.subject,
      html: html,
    })

    console.log(`Email sent successfully to ${config.to}:`, info.messageId)
    return true
  } catch (error) {
    console.error(`Error sending email to ${config.to}:`, error)
    return false
  }
}

// Send newsletter to multiple recipients
export async function sendNewsletterToList(
  subject: string,
  posts: EmailPost[],
  subscribers: Array<{ email: string; unsubscribe_token: string }>,
  newsletterId?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  // Send emails in batches to avoid overwhelming the SMTP server
  const batchSize = 10
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize)
    
    const promises = batch.map(async (subscriber) => {
      const success = await sendNewsletterEmail({
        to: subscriber.email,
        subject,
        posts,
        unsubscribeToken: subscriber.unsubscribe_token,
        newsletterId,
        subscriberEmail: subscriber.email,
      })
      
      if (success) {
        sent++
      } else {
        failed++
      }
    })

    await Promise.all(promises)
    
    // Add a small delay between batches
    if (i + batchSize < subscribers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return { sent, failed }
}

// Generate welcome email HTML template
export function generateWelcomeEmailHTML(email: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Archalley Newsletter</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Roboto', Arial, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #FFA500;
            color: white;
            text-align: center;
            padding: 40px 20px;
        }
        .logo-img {
            max-width: 200px;
            height: auto;
            margin: 0 auto 10px auto;
            display: block;
        }
        .tagline {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 20px;
            text-align: center;
        }
        .welcome-message {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .description {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .features {
            text-align: left;
            max-width: 400px;
            margin: 0 auto 30px;
        }
        .features ul {
            color: #555;
            padding-left: 20px;
        }
        .features li {
            margin-bottom: 10px;
        }
        .footer {
            background-color: #333;
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        .footer a {
            color: #FFA500;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${process.env.NEXTAUTH_URL}/images/archalley-logo.png" alt="Archalley" class="logo-img" />
            <div class="tagline">Architecture & Design Newsletter</div>
        </div>
        
        <div class="content">
            <div class="welcome-message">Welcome to Archalley Newsletter!</div>
            
            <div class="description">
                Thank you for subscribing to our newsletter! We're excited to have you join our community of architecture and design enthusiasts.
            </div>
            
            <div class="features">
                <p><strong>What you can expect:</strong></p>
                <ul>
                    <li>Latest architectural news and trends</li>
                    <li>Exclusive design insights and inspiration</li>
                    <li>Special offers and announcements</li>
                    <li>Curated content from around the world</li>
                </ul>
            </div>
            
            <p style="color: #666;">
                We'll be sending you our newsletter regularly with the latest updates. 
                If you have any questions or feedback, feel free to reach out to us.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Archalley</strong> - Your source for architecture and design inspiration</p>
            <p>Visit us at <a href="https://archalley.com">archalley.com</a></p>
            <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
                You're receiving this email because you subscribed to our newsletter.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// Generate unsubscribe confirmation email HTML template
export function generateUnsubscribeEmailHTML(email: string, unsubscribeToken?: string): string {
  const resubscribeUrl = unsubscribeToken 
    ? `${process.env.NEXTAUTH_URL}/api/resubscribe?token=${unsubscribeToken}`
    : 'https://archalley.com'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribed from Archalley Newsletter</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Roboto', Arial, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #FFA500;
            color: white;
            text-align: center;
            padding: 40px 20px;
        }
        .logo-img {
            max-width: 200px;
            height: auto;
            margin: 0 auto 10px auto;
            display: block;
        }
        .tagline {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 20px;
            text-align: center;
        }
        .unsubscribe-message {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .description {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .footer {
            background-color: #333;
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        .footer a {
            color: #FFA500;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .resubscribe-btn {
            display: inline-block;
            background-color: #28a745;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none !important;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 5px;
        }
        .resubscribe-btn:hover {
            background-color: #218838;
            color: white !important;
        }
        .resubscribe-btn:visited {
            color: white !important;
        }
        .resubscribe-btn:link {
            color: white !important;
        }
        .btn-group {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${process.env.NEXTAUTH_URL}/images/archalley-logo.png" alt="Archalley" class="logo-img" />
            <div class="tagline">Architecture & Design Newsletter</div>
        </div>
        
        <div class="content">
            <div class="unsubscribe-message">You've been unsubscribed</div>
            
            <div class="description">
                We're sorry to see you go! You have been successfully unsubscribed from our newsletter and will no longer receive our updates.
            </div>
            
            <p style="color: #666;">
                If you unsubscribed by mistake or change your mind, you can always resubscribe by clicking the button below.
            </p>
            
            <div class="btn-group">
                <a href="${resubscribeUrl}" class="resubscribe-btn">Resubscribe to Newsletter</a>
                <a href="https://archalley.com" class="resubscribe-btn" style="background-color: #FFA500; color: white !important;">Visit Archalley.com</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Archalley</strong> - Your source for architecture and design inspiration</p>
            <p>Visit us at <a href="https://archalley.com">archalley.com</a></p>
            <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
                Thank you for being part of the Archalley community.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// Send welcome email to new subscriber
export async function sendWelcomeEmail(to: string): Promise<boolean> {
  try {
    console.log(`Sending welcome email to: ${to}`)
    
    const html = generateWelcomeEmailHTML(to)
    
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'Welcome to Archalley Newsletter!',
      html: html,
    })

    console.log(`Welcome email sent successfully to ${to}:`, info.messageId)
    return true
  } catch (error) {
    console.error(`Error sending welcome email to ${to}:`, error)
    return false
  }
}

// Send unsubscribe confirmation email
export async function sendUnsubscribeEmail(to: string, unsubscribeToken?: string): Promise<boolean> {
  try {
    console.log(`Sending unsubscribe confirmation email to: ${to}`)
    
    const html = generateUnsubscribeEmailHTML(to, unsubscribeToken)
    
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'You\'ve been unsubscribed from Archalley Newsletter',
      html: html,
    })

    console.log(`Unsubscribe confirmation email sent successfully to ${to}:`, info.messageId)
    return true
  } catch (error) {
    console.error(`Error sending unsubscribe confirmation email to ${to}:`, error)
    return false
  }
}