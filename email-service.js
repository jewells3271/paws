const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, 'grooming.db');

// Email service class
class EmailService {
    constructor() {
        this.transporter = null;
        this.config = null;
    }

    // Load email configuration from database
    async loadConfig() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(DB_FILE);
            db.get('SELECT * FROM email_config WHERE id = 1', [], (err, row) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    this.config = row;
                    if (row && row.enabled) {
                        this.createTransporter();
                    }
                    resolve(row);
                }
            });
        });
    }

    // Create nodemailer transporter based on config
    createTransporter() {
        if (!this.config || !this.config.enabled) {
            return null;
        }

        let smtpConfig;

        if (this.config.provider === 'gmail') {
            smtpConfig = {
                service: 'gmail',
                auth: {
                    user: this.config.email,
                    pass: this.config.password
                }
            };
        } else if (this.config.provider === 'hostinger') {
            smtpConfig = {
                host: this.config.smtp_host || 'smtp.hostinger.com',
                port: this.config.smtp_port || 465,
                secure: true, // use SSL
                auth: {
                    user: this.config.email,
                    pass: this.config.password
                }
            };
        } else {
            // Custom SMTP
            smtpConfig = {
                host: this.config.smtp_host,
                port: this.config.smtp_port || 587,
                secure: this.config.smtp_port === 465,
                auth: {
                    user: this.config.email,
                    pass: this.config.password
                }
            };
        }

        this.transporter = nodemailer.createTransport(smtpConfig);
        return this.transporter;
    }

    // Test email connection
    async testConnection() {
        if (!this.transporter) {
            await this.loadConfig();
            if (!this.transporter) {
                throw new Error('Email not configured');
            }
        }

        return this.transporter.verify();
    }

    // Send appointment confirmation email
    async sendBookingConfirmation(appointmentData) {
        if (!this.config || !this.config.enabled) {
            console.log('Email not enabled, skipping confirmation email');
            return { success: false, message: 'Email not enabled' };
        }

        if (!appointmentData.clientEmail) {
            console.log('No client email provided, skipping confirmation email');
            return { success: false, message: 'No client email' };
        }

        const { clientName, clientEmail, petName, serviceName, appointmentDate, appointmentTime, groomerName, price, shopName, shopPhone } = appointmentData;

        const subject = `Appointment Confirmed - ${petName} at ${shopName || 'Paws Grooming'}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #00d4ff, #b84fff); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .detail-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #00d4ff; }
                    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .detail-row:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #555; }
                    .value { color: #333; }
                    .footer { text-align: center; padding: 20px; color: #777; font-size: 14px; }
                    .button { display: inline-block; background: #00d4ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐾 Appointment Confirmed!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${clientName},</p>
                        <p>Your grooming appointment for <strong>${petName}</strong> has been confirmed!</p>
                        
                        <div class="detail-box">
                            <div class="detail-row">
                                <span class="label">Pet:</span>
                                <span class="value">${petName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Service:</span>
                                <span class="value">${serviceName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Date:</span>
                                <span class="value">${appointmentDate}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Time:</span>
                                <span class="value">${appointmentTime}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Groomer:</span>
                                <span class="value">${groomerName}</span>
                            </div>
                            ${price ? `<div class="detail-row">
                                <span class="label">Price:</span>
                                <span class="value">$${price.toFixed(2)}</span>
                            </div>` : ''}
                        </div>

                        <p><strong>Important:</strong> To cancel or reschedule, please call us at <strong>${shopPhone || 'our shop'}</strong>.</p>
                        
                        <p>We look forward to seeing ${petName}!</p>
                    </div>
                    <div class="footer">
                        <p>${shopName || 'Paws Grooming'}</p>
                        ${shopPhone ? `<p>Phone: ${shopPhone}</p>` : ''}
                        <p style="font-size: 12px; color: #999;">This is an automated confirmation email.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Appointment Confirmed!

Hi ${clientName},

Your grooming appointment for ${petName} has been confirmed!

Pet: ${petName}
Service: ${serviceName}
Date: ${appointmentDate}
Time: ${appointmentTime}
Groomer: ${groomerName}
${price ? `Price: $${price.toFixed(2)}` : ''}

To cancel or reschedule, please call us at ${shopPhone || 'our shop'}.

We look forward to seeing ${petName}!

${shopName || 'Paws Grooming'}
${shopPhone ? `Phone: ${shopPhone}` : ''}
        `;

        try {
            const info = await this.transporter.sendMail({
                from: `"${shopName || 'Paws Grooming'}" <${this.config.email}>`,
                to: clientEmail,
                subject: subject,
                text: text,
                html: html
            });

            console.log('Booking confirmation email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending booking confirmation email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send appointment reminder email
    async sendAppointmentReminder(appointmentData) {
        if (!this.config || !this.config.enabled) {
            console.log('Email not enabled, skipping reminder email');
            return { success: false, message: 'Email not enabled' };
        }

        if (!appointmentData.clientEmail) {
            console.log('No client email provided, skipping reminder email');
            return { success: false, message: 'No client email' };
        }

        const { clientName, clientEmail, petName, serviceName, appointmentDate, appointmentTime, groomerName, shopName, shopPhone } = appointmentData;

        const subject = `Reminder: ${petName}'s Appointment Tomorrow`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ff6b35, #b84fff); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .reminder-box { background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ff6b35; }
                    .detail-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
                    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .detail-row:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #555; }
                    .value { color: #333; }
                    .footer { text-align: center; padding: 20px; color: #777; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐾 Appointment Reminder</h1>
                    </div>
                    <div class="content">
                        <div class="reminder-box">
                            <h2 style="margin-top: 0; color: #ff6b35;">Tomorrow's Appointment</h2>
                            <p style="margin: 0;">Don't forget! ${petName} has a grooming appointment tomorrow.</p>
                        </div>
                        
                        <p>Hi ${clientName},</p>
                        <p>This is a friendly reminder about ${petName}'s upcoming grooming appointment:</p>
                        
                        <div class="detail-box">
                            <div class="detail-row">
                                <span class="label">Pet:</span>
                                <span class="value">${petName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Service:</span>
                                <span class="value">${serviceName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Date:</span>
                                <span class="value">${appointmentDate}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Time:</span>
                                <span class="value">${appointmentTime}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Groomer:</span>
                                <span class="value">${groomerName}</span>
                            </div>
                        </div>

                        <p>If you need to cancel or reschedule, please call us as soon as possible at <strong>${shopPhone || 'our shop'}</strong>.</p>
                        
                        <p>See you tomorrow!</p>
                    </div>
                    <div class="footer">
                        <p>${shopName || 'Paws Grooming'}</p>
                        ${shopPhone ? `<p>Phone: ${shopPhone}</p>` : ''}
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Appointment Reminder

Hi ${clientName},

This is a friendly reminder about ${petName}'s upcoming grooming appointment:

Pet: ${petName}
Service: ${serviceName}
Date: ${appointmentDate}
Time: ${appointmentTime}
Groomer: ${groomerName}

If you need to cancel or reschedule, please call us as soon as possible at ${shopPhone || 'our shop'}.

See you tomorrow!

${shopName || 'Paws Grooming'}
${shopPhone ? `Phone: ${shopPhone}` : ''}
        `;

        try {
            const info = await this.transporter.sendMail({
                from: `"${shopName || 'Paws Grooming'}" <${this.config.email}>`,
                to: clientEmail,
                subject: subject,
                text: text,
                html: html
            });

            console.log('Reminder email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending reminder email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send cancellation notification
    async sendCancellationNotification(appointmentData) {
        if (!this.config || !this.config.enabled) {
            console.log('Email not enabled, skipping cancellation email');
            return { success: false, message: 'Email not enabled' };
        }

        if (!appointmentData.clientEmail) {
            console.log('No client email provided, skipping cancellation email');
            return { success: false, message: 'No client email' };
        }

        const { clientName, clientEmail, petName, serviceName, appointmentDate, appointmentTime, shopName, shopPhone } = appointmentData;

        const subject = `Appointment Cancelled - ${petName}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #6c757d; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .cancel-box { background: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc3545; }
                    .footer { text-align: center; padding: 20px; color: #777; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Appointment Cancelled</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${clientName},</p>
                        
                        <div class="cancel-box">
                            <p style="margin: 0;"><strong>The following appointment has been cancelled:</strong></p>
                        </div>
                        
                        <p><strong>Pet:</strong> ${petName}<br>
                        <strong>Service:</strong> ${serviceName}<br>
                        <strong>Date:</strong> ${appointmentDate}<br>
                        <strong>Time:</strong> ${appointmentTime}</p>

                        <p>To schedule a new appointment, please call us at <strong>${shopPhone || 'our shop'}</strong> or visit our online booking page.</p>
                    </div>
                    <div class="footer">
                        <p>${shopName || 'Paws Grooming'}</p>
                        ${shopPhone ? `<p>Phone: ${shopPhone}</p>` : ''}
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            const info = await this.transporter.sendMail({
                from: `"${shopName || 'Paws Grooming'}" <${this.config.email}>`,
                to: clientEmail,
                subject: subject,
                html: html
            });

            console.log('Cancellation email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending cancellation email:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
module.exports = new EmailService();
