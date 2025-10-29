import nodemailer from 'nodemailer';

// Create Brevo SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Use TLS
  requireTLS: true, // Require TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify SMTP configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

/**
 * Send certificate email to recipient
 * @param {Object} params - Email parameters
 * @param {string} params.recipientEmail - Recipient's email address
 * @param {string} params.recipientName - Recipient's name
 * @param {string} params.eventName - Event name
 * @param {string} params.uniqueId - Certificate unique ID
 * @param {string} params.validationUrl - URL to validate certificate
 * @param {string} params.pdfUrl - URL to download certificate PDF (optional)
 */
export const sendCertificateEmail = async ({
  recipientEmail,
  recipientName,
  eventName,
  uniqueId,
  validationUrl,
  pdfUrl,
}) => {
  try {
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: `Your Certificate for ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4285f4; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .cert-id { background-color: #e8f0fe; padding: 10px; border-left: 4px solid #4285f4; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Congratulations, ${recipientName}!</h1>
            </div>
            <div class="content">
              <p>We are pleased to inform you that your certificate for <strong>${eventName}</strong> has been generated.</p>
              
              <div class="cert-id">
                <strong>Certificate ID:</strong> ${uniqueId}
              </div>
              
              <p>You can validate your certificate at any time using the link below:</p>
              <p style="text-align: center;">
                <a href="${validationUrl}" class="button">Validate Certificate</a>
              </p>
              
              ${pdfUrl ? `
                <p>You can also download your certificate PDF:</p>
                <p style="text-align: center;">
                  <a href="${pdfUrl}" class="button">Download Certificate</a>
                </p>
              ` : ''}
              
              <p>Keep your Certificate ID safe for future reference.</p>
            </div>
            <div class="footer">
              <p>This email was sent by GDGoC Certificate System</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Congratulations, ${recipientName}!
        
        Your certificate for ${eventName} has been generated.
        
        Certificate ID: ${uniqueId}
        
        Validate your certificate at: ${validationUrl}
        ${pdfUrl ? `\nDownload your certificate: ${pdfUrl}` : ''}
        
        Keep your Certificate ID safe for future reference.
        
        This email was sent by GDGoC Certificate System
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export default { sendCertificateEmail };
