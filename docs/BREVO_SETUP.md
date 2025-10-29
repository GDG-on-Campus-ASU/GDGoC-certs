# Setting Up Brevo (Sendinblue) SMTP

This guide explains how to configure Brevo (formerly Sendinblue) SMTP for sending certificate emails.

## Prerequisites

- Brevo account (free tier available)
- Domain for sending emails (optional but recommended)

## Step 1: Create a Brevo Account

1. Go to [Brevo](https://www.brevo.com/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get SMTP Credentials

1. Log in to your Brevo account
2. Navigate to **Settings** (top right)
3. Click on **SMTP & API**
4. Click on **SMTP** tab
5. You'll see your SMTP credentials:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587` (recommended) or `465` (SSL)
   - **Login**: Your Brevo email
   - **SMTP Key**: Click "Create a new SMTP key" if needed

## Step 3: (Optional) Add and Verify Domain

For better deliverability, add your sending domain:

1. Go to **Senders, Domains & Dedicated IPs**
2. Click **Domains** tab
3. Click **Add a Domain**
4. Enter your domain (e.g., `gdg-oncampus.dev`)
5. Add the required DNS records to your domain:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
6. Wait for verification (can take up to 24 hours)

## Step 4: Configure Sender Email

1. Go to **Senders, Domains & Dedicated IPs**
2. Click **Senders** tab
3. Click **Add a Sender**
4. Enter sender details:
   - **Email**: `noreply@gdg-oncampus.dev`
   - **Name**: `GDGoC Certificate System`
5. Verify the email (Brevo will send a verification link)

## Step 5: Update Environment Variables

Update your `.env` file with Brevo configuration:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-email@example.com
SMTP_PASSWORD=your-smtp-key-here
SMTP_FROM_EMAIL=noreply@gdg-oncampus.dev
SMTP_FROM_NAME=GDGoC Certificate System
```

Replace:
- `your-brevo-email@example.com` with your Brevo account email
- `your-smtp-key-here` with your SMTP key from Step 2
- `noreply@gdg-oncampus.dev` with your verified sender email

## Step 6: Test Email Sending

You can test email sending using the backend API:

### Using curl:
```bash
curl -X POST https://api.certs.gdg-oncampus.dev/api/certificates/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_name": "Test User",
    "recipient_email": "test@example.com",
    "event_type": "workshop",
    "event_name": "Test Workshop"
  }'
```

Check the backend logs to see if the email was sent successfully.

## Brevo Free Tier Limits

- **300 emails per day**
- SMTP relay included
- No credit card required
- Good for testing and small deployments

For production use with higher volume, consider upgrading to a paid plan.

## Email Template

The application sends HTML emails with:
- GDGoC branding
- Certificate details (recipient name, event, certificate ID)
- Validation link
- Download link (if PDF URL is available)

The template is defined in `backend/src/services/emailService.js`.

## Troubleshooting

### "Authentication failed"
- Verify SMTP_USER is your Brevo account email
- Verify SMTP_PASSWORD is a valid SMTP key (not your account password)
- Generate a new SMTP key if needed

### "Sender not verified"
- Ensure SMTP_FROM_EMAIL is verified in Brevo
- Check the **Senders** section in Brevo dashboard

### "Email not received"
- Check spam/junk folder
- Verify recipient email is correct
- Check Brevo dashboard for delivery status
- Review backend logs for errors

### "Daily limit exceeded"
- Free tier has 300 emails/day limit
- Upgrade to paid plan for higher limits
- Or spread bulk operations across multiple days

## Best Practices

1. **Verify Your Domain**: Improves deliverability significantly
2. **Use DKIM/SPF**: Prevents emails from being marked as spam
3. **Monitor Sending**: Check Brevo dashboard regularly
4. **Handle Bounces**: Monitor bounce rates and remove invalid emails
5. **Rate Limiting**: Don't send too many emails at once

## Alternative SMTP Providers

If you prefer a different SMTP provider, the application works with any SMTP service. Just update the environment variables:

- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **Amazon SES**: `email-smtp.region.amazonaws.com:587`

## Resources

- [Brevo Documentation](https://developers.brevo.com/)
- [SMTP Configuration Guide](https://help.brevo.com/hc/en-us/articles/209467485)
- [Email Deliverability Best Practices](https://www.brevo.com/blog/email-deliverability/)
