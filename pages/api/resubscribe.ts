import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.method === 'GET' ? req.query : req.body
  
  // Set headers to prevent caching and ensure HTML rendering
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  if (!token || typeof token !== 'string') {
    res.setHeader('Content-Type', 'text/html')
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Invalid Link - Archalley</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              .logo { color: #FFA500; font-size: 32px; font-weight: bold; margin-bottom: 20px; }
              h1 { color: #333; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; margin-bottom: 20px; }
              .btn { display: inline-block; background-color: #FFA500; color: white !important; padding: 12px 24px; text-decoration: none !important; border-radius: 5px; font-weight: bold; margin: 5px; }
              .btn:hover { background-color: #e69500; color: white !important; }
              .btn:visited { color: white !important; }
              .btn:link { color: white !important; }
              .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo">Archalley</div>
              <h1>Invalid Link</h1>
              <div class="error">
                  <strong>Invalid resubscribe link</strong><br>
                  The link you clicked is not valid or has expired.
              </div>
              <p>Please try subscribing again from our website.</p>
              <a href="https://archalley.com" class="btn">Visit Archalley.com</a>
          </div>
      </body>
      </html>
    `)
  }

  try {
    // Find subscriber by unsubscribe token
    const { data: subscriber, error: findError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('unsubscribe_token', token)
      .single()

    if (findError || !subscriber) {
      res.setHeader('Content-Type', 'text/html')
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Link Not Found - Archalley</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5; }
                .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                .logo { color: #FFA500; font-size: 32px; font-weight: bold; margin-bottom: 20px; }
                h1 { color: #333; margin-bottom: 20px; }
                p { color: #666; line-height: 1.6; margin-bottom: 20px; }
                .btn { display: inline-block; background-color: #FFA500; color: white !important; padding: 12px 24px; text-decoration: none !important; border-radius: 5px; font-weight: bold; margin: 5px; }
                .btn:hover { background-color: #e69500; color: white !important; }
                .btn:visited { color: white !important; }
                .btn:link { color: white !important; }
                .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">Archalley</div>
                <h1>Link Not Found</h1>
                <div class="error">
                    <strong>Invalid resubscribe link</strong><br>
                    The link you clicked is not valid or has expired.
                </div>
                <p>Please try subscribing again from our website.</p>
                <a href="https://archalley.com" class="btn">Visit Archalley.com</a>
            </div>
        </body>
        </html>
      `)
    }

    if (subscriber.status === 'active') {
      res.setHeader('Content-Type', 'text/html')
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Already Subscribed - Archalley</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5; }
                .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                .logo { color: #FFA500; font-size: 32px; font-weight: bold; margin-bottom: 20px; }
                h1 { color: #333; margin-bottom: 20px; }
                p { color: #666; line-height: 1.6; margin-bottom: 20px; }
                .btn { display: inline-block; background-color: #FFA500; color: white !important; padding: 12px 24px; text-decoration: none !important; border-radius: 5px; font-weight: bold; margin: 5px; }
                .btn:hover { background-color: #e69500; color: white !important; }
                .btn:visited { color: white !important; }
                .btn:link { color: white !important; }
                .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">Archalley</div>
                <h1>Already Subscribed</h1>
                <div class="success">
                    <strong>You are already subscribed!</strong><br>
                    You're already receiving our newsletter updates.
                </div>
                <p>Thank you for being part of the Archalley community!</p>
                <a href="https://archalley.com" class="btn">Visit Archalley.com</a>
            </div>
        </body>
        </html>
      `)
    }

    // Update subscriber status to active
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        status: 'active',
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      })
      .eq('unsubscribe_token', token)

    if (updateError) {
      throw updateError
    }

    // Send welcome email for resubscription
    try {
      await sendWelcomeEmail(subscriber.email)
    } catch (emailError) {
      console.error('Error sending welcome email for resubscription:', emailError)
      // Don't fail the resubscription if email fails
    }

    res.setHeader('Content-Type', 'text/html')
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Successfully Resubscribed - Archalley</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              .logo { color: #FFA500; font-size: 32px; font-weight: bold; margin-bottom: 20px; }
              h1 { color: #333; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; margin-bottom: 20px; }
              .btn { display: inline-block; background-color: #FFA500; color: white !important; padding: 12px 24px; text-decoration: none !important; border-radius: 5px; font-weight: bold; margin: 5px; }
              .btn:hover { background-color: #e69500; color: white !important; }
              .btn:visited { color: white !important; }
              .btn:link { color: white !important; }
              .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo">Archalley</div>
              <h1>Welcome Back!</h1>
              <div class="success">
                  <strong>Successfully resubscribed!</strong><br>
                  You have been successfully resubscribed to our newsletter.
              </div>
              <p>Thank you for rejoining the Archalley community! You'll start receiving our updates again.</p>
              <a href="https://archalley.com" class="btn">Visit Archalley.com</a>
          </div>
      </body>
      </html>
    `)
  } catch (error) {
    console.error('Error resubscribing:', error)
    res.setHeader('Content-Type', 'text/html')
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Error - Archalley</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              .logo { color: #FFA500; font-size: 32px; font-weight: bold; margin-bottom: 20px; }
              h1 { color: #333; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; margin-bottom: 20px; }
              .btn { display: inline-block; background-color: #FFA500; color: white !important; padding: 12px 24px; text-decoration: none !important; border-radius: 5px; font-weight: bold; margin: 5px; }
              .btn:hover { background-color: #e69500; color: white !important; }
              .btn:visited { color: white !important; }
              .btn:link { color: white !important; }
              .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo">Archalley</div>
              <h1>Error</h1>
              <div class="error">
                  <strong>Something went wrong</strong><br>
                  We encountered an error while processing your resubscription.
              </div>
              <p>Please try again later or contact support if the problem persists.</p>
              <a href="https://archalley.com" class="btn">Visit Archalley.com</a>
          </div>
      </body>
      </html>
    `)
  }
}
