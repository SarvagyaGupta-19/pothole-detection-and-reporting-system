import nodemailer from 'nodemailer';

export async function sendMunicipalityNotification(
  toEmail: string,
  userEmail: string,
  reportId: string,
  severity: string,
  latitude: number,
  longitude: number,
  imageUrl: string
) {
  try {
    const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    
    // Configure nodemailer transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Pothole Reporting System" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      replyTo: userEmail,
      subject: `Civic Alert: ${severity} Road Damage Reported`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">New Pothole Report</h2>
          </div>
          <div style="padding: 20px; background-color: white;">
            <p style="font-size: 16px; color: #374151;">A new road hazard has been reported in your jurisdiction and verified by AI.</p>
            
            <div style="background-color: #fef3c7; padding: 10px 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #f59e0b;">
              <strong>Reported by verified citizen:</strong> ${userEmail}<br/>
              <em>Replies to this email will go directly to the citizen.</em>
            </div>

            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Severity:</strong> <span style="color: #b91c1c;">${severity}</span></p>
              <p style="margin: 5px 0;"><strong>Coordinates:</strong> ${latitude}, ${longitude}</p>
              <p style="margin: 5px 0;"><strong>Report ID:</strong> ${reportId}</p>
            </div>
            
            <div style="margin-top: 20px; margin-bottom: 20px; text-align: center;">
              <p style="margin-bottom: 10px; font-weight: bold; color: #374151;">Photographic Evidence:</p>
              <img src="${imageUrl}" alt="Pothole Evidence" style="max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;" />
            </div>

            <div style="margin-top: 20px; text-align: center;">
              <a href="${mapsLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Exact Location on Google Maps</a>
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            This is an automated notification from the Pothole Reporting System.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully via Nodemailer!", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send email via Nodemailer:", error);
    return false;
  }
}
