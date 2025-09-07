import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { sendUnsubscribeEmail } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token, confirm } = req.query

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Invalid unsubscribe token' })
  }

  try {
    // Find subscriber by unsubscribe token
    const { data: subscriber, error: findError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('unsubscribe_token', token)
      .single()

    if (findError || !subscriber) {
      return res.status(404).json({ message: 'Invalid unsubscribe link' })
    }

    if (subscriber.status === 'unsubscribed') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Already Unsubscribed - Archalley</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5; }
                .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                .logo { color: #FFA500; font-size: 32px; font-weight: bold; margin-bottom: 20px; }
                h1 { color: #333; margin-bottom: 20px; }
                p { color: #666; line-height: 1.6; margin-bottom: 20px; }
                .btn { display: inline-block; background-color: #FFA500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px; }
                .btn:hover { background-color: #e69500; }
                .btn-secondary { background-color: #28a745; }
                .btn-secondary:hover { background-color: #218838; }
                .btn-group { margin-top: 20px; }
                .loading { opacity: 0.6; pointer-events: none; }
                .message { margin-top: 15px; padding: 10px; border-radius: 5px; }
                .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">Archalley</div>
                <h1>Already Unsubscribed</h1>
                <p>You have already been unsubscribed from our newsletter.</p>
                <p>If you received this email by mistake or want to resubscribe, you can do so below.</p>
                <div class="btn-group">
                    <button onclick="resubscribe()" class="btn btn-secondary" id="resubscribeBtn">Resubscribe</button>
                    <a href="https://archalley.com" class="btn">Visit Archalley.com</a>
                </div>
                <div id="message"></div>
            </div>
            <script>
                async function resubscribe() {
                    const btn = document.getElementById('resubscribeBtn');
                    const messageDiv = document.getElementById('message');
                    
                    btn.classList.add('loading');
                    btn.textContent = 'Resubscribing...';
                    
                    try {
                        const response = await fetch('/api/resubscribe', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                token: '${token}'
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (response.ok) {
                            messageDiv.innerHTML = '<div class="message success">' + result.message + '</div>';
                            btn.style.display = 'none';
                        } else {
                            messageDiv.innerHTML = '<div class="message error">' + result.message + '</div>';
                        }
                    } catch (error) {
                        messageDiv.innerHTML = '<div class="message error">An error occurred. Please try again.</div>';
                    } finally {
                        btn.classList.remove('loading');
                        btn.textContent = 'Resubscribe';
                    }
                }
            </script>
        </body>
        </html>
      `)
    }

    // If not confirmed, show confirmation page
    if (!confirm) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Confirm Unsubscribe - Archalley</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5; }
                .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                .logo { color: #FFA500; font-size: 32px; font-weight: bold; margin-bottom: 20px; }
                h1 { color: #333; margin-bottom: 20px; }
                p { color: #666; line-height: 1.6; margin-bottom: 20px; }
                .btn { display: inline-block; background-color: #FFA500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px; }
                .btn:hover { background-color: #e69500; }
                .btn-danger { background-color: #dc3545; }
                .btn-danger:hover { background-color: #c82333; }
                .btn-secondary { background-color: #6c757d; }
                .btn-secondary:hover { background-color: #5a6268; }
                .btn-group { margin-top: 20px; }
                .warning { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">Archalley</div>
                <h1>Confirm Unsubscribe</h1>
                <div class="warning">
                    <strong>Are you sure you want to unsubscribe?</strong><br>
                    You will no longer receive our newsletter updates.
                </div>
                <p>If you unsubscribe, you'll miss out on:</p>
                <ul style="text-align: left; color: #666; margin: 20px 0;">
                    <li>Latest architectural news and trends</li>
                    <li>Exclusive content and insights</li>
                    <li>Special offers and announcements</li>
                </ul>
                <div class="btn-group">
                    <a href="?token=${token}&confirm=true" class="btn btn-danger">Yes, Unsubscribe</a>
                    <a href="https://archalley.com" class="btn btn-secondary">Cancel</a>
                </div>
            </div>
        </body>
        </html>
      `)
    }

    // Update subscriber status to unsubscribed
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('unsubscribe_token', token)

    if (updateError) {
      throw updateError
    }

    // Send unsubscribe confirmation email
    try {
      await sendUnsubscribeEmail(subscriber.email, subscriber.unsubscribe_token)
    } catch (emailError) {
      console.error('Error sending unsubscribe confirmation email:', emailError)
      // Don't fail the unsubscription if email fails
    }

    // Return success page
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Unsubscribed Successfully - Archalley</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              .logo { color: #FFA500; font-size: 32px; font-weight: bold; margin-bottom: 20px; }
              h1 { color: #333; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; margin-bottom: 20px; }
              .btn { display: inline-block; background-color: #FFA500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px; }
              .btn:hover { background-color: #e69500; }
              .btn-secondary { background-color: #28a745; }
              .btn-secondary:hover { background-color: #218838; }
              .btn-group { margin-top: 20px; }
              .loading { opacity: 0.6; pointer-events: none; }
              .message { margin-top: 15px; padding: 10px; border-radius: 5px; }
              .success { color: #4caf50; font-weight: bold; }
              .success-message { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
              .error-message { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo">Archalley</div>
              <h1>Successfully Unsubscribed</h1>
              <p class="success">You have been successfully unsubscribed from our newsletter.</p>
              <p>We're sorry to see you go! If you change your mind, you can resubscribe below or visit our website.</p>
              <p>Thank you for being part of the Archalley community.</p>
              <div class="btn-group">
                  <button onclick="resubscribe()" class="btn btn-secondary" id="resubscribeBtn">Resubscribe</button>
                  <a href="https://archalley.com" class="btn">Visit Archalley.com</a>
              </div>
              <div id="message"></div>
          </div>
          <script>
              async function resubscribe() {
                  const btn = document.getElementById('resubscribeBtn');
                  const messageDiv = document.getElementById('message');
                  
                  btn.classList.add('loading');
                  btn.textContent = 'Resubscribing...';
                  
                  try {
                      const response = await fetch('/api/resubscribe', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                              token: '${token}'
                          })
                      });
                      
                      const result = await response.json();
                      
                      if (response.ok) {
                          messageDiv.innerHTML = '<div class="message success-message">' + result.message + '</div>';
                          btn.style.display = 'none';
                      } else {
                          messageDiv.innerHTML = '<div class="message error-message">' + result.message + '</div>';
                      }
                  } catch (error) {
                      messageDiv.innerHTML = '<div class="message error-message">An error occurred. Please try again.</div>';
                  } finally {
                      btn.classList.remove('loading');
                      btn.textContent = 'Resubscribe';
                  }
              }
          </script>
      </body>
      </html>
    `)
  } catch (error) {
    console.error('Error unsubscribing:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
