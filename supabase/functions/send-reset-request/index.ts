// ===== Edge Function: send-reset-request =====
// Sends a password reset request email to Smit (admin) via Resend API.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Boulder Reports <reports@boulder-daily-reports.com>'
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'smit@boulderconstruction.com'

async function sendEmail(userEmail: string): Promise<void> {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #E8783A, #F5A623); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; font-size: 20px; margin: 0;">Password Reset Request</h1>
        <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0;">Boulder Daily Site Reports</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 15px; color: #333; margin: 0 0 16px;">Hi Smit,</p>
        <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 20px;">
          A user has requested a password reset for their Boulder Daily Reports account.
        </p>
        <div style="background: #f8f7f5; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; border-left: 4px solid #E8783A;">
          <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px; font-weight: 600;">User Email</p>
          <p style="font-size: 16px; color: #E8783A; font-weight: 700; margin: 0;">${userEmail}</p>
        </div>
        <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 24px;">
          Please log in to the admin panel and reset their password from <strong>My Profile → Manage Users</strong>.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 11px; color: #aaa; margin: 0;">
          This is an automated message from Boulder Daily Site Reports.
        </p>
      </div>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [ADMIN_EMAIL],
      subject: 'Password Reset Request - Boulder Daily Reports',
      html: htmlBody,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to send email: ${err}`)
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { userEmail } = await req.json()

    if (!userEmail || !userEmail.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send the email to Smit
    await sendEmail(userEmail)

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error sending reset request:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed to send request' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
