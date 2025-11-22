# Email Setup Guide - PAWS

**PAWS** = **Pet Appointment & Workflow System**

This guide will help you set up email notifications for appointment confirmations, reminders, and cancellations.

---

## Email Features

### Automatic Emails
- ✅ **Booking Confirmation** - Sent immediately when a client books online
- ✅ **Cancellation Notice** - Sent when you cancel an appointment from admin panel

### Manual Emails
- ✅ **Appointment Reminder** - Click "Send Reminder" button in admin panel

### Email Content
All emails include:
- Your shop name and phone number
- Pet name and service details
- Appointment date, time, and groomer
- Service price
- Professional, branded design

---

## Option 1: Gmail Setup (Easiest)

### Step 1: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left menu
3. Under "How you sign in to Google," click **2-Step Verification**
4. Follow the steps to enable it

### Step 2: Create an App Password

1. Go to: https://myaccount.google.com/apppasswords
2. In the "Select app" dropdown, choose **Mail**
3. In the "Select device" dropdown, choose **Other (Custom name)**
4. Type: **Paws Grooming**
5. Click **Generate**
6. **Copy the 16-character password** (you'll need this!)

### Step 3: Configure in PAWS

1. Open PAWS admin panel: http://localhost:3000/admin/
2. Login with PIN `4921`
3. Go to **Settings** in the left menu
4. Check **"Enable Email Notifications"**
5. Fill in:
   - **Email Provider**: Gmail
   - **Email Address**: your-email@gmail.com
   - **Password**: Paste the 16-character app password
   - **Shop Name**: Your Grooming Shop Name
   - **Shop Phone**: (555) 123-4567
6. Click **Test Connection**
7. Check your inbox for a test email
8. Click **Save Email Settings**

**Done!** Emails will now send automatically.

---

## Option 2: Hostinger Email Setup

### Step 1: Get Your Email Credentials

1. Login to Hostinger control panel
2. Go to **Emails** section
3. Find your email account (e.g., appointments@yourshop.com)
4. Note your **email address** and **password**

### Step 2: Configure in PAWS

1. Open PAWS admin panel: http://localhost:3000/admin/
2. Go to **Settings**
3. Check **"Enable Email Notifications"**
4. Fill in:
   - **Email Provider**: Hostinger
   - **Email Address**: appointments@yourshop.com
   - **Password**: Your email password
   - **Shop Name**: Your Grooming Shop Name
   - **Shop Phone**: (555) 123-4567
5. Click **Test Connection**
6. Check your inbox for a test email
7. Click **Save Email Settings**

**Done!** Professional emails from your own domain!

---

## Option 3: Custom SMTP (Advanced)

If you use another email provider (like Outlook, Yahoo, etc.):

1. Get SMTP settings from your email provider:
   - SMTP Host (e.g., smtp.office365.com)
   - SMTP Port (usually 587 or 465)
   - Your email and password

2. In PAWS Settings:
   - **Email Provider**: Custom SMTP
   - **Email Address**: your-email@provider.com
   - **Password**: Your email password
   - **SMTP Host**: smtp.provider.com
   - **SMTP Port**: 587
   - **Shop Name**: Your Grooming Shop Name
   - **Shop Phone**: (555) 123-4567

3. Test and save

---

## Troubleshooting

### "Email connection failed"

**For Gmail:**
- Make sure 2-Step Verification is enabled
- Use an App Password, not your regular password
- Check that you copied the entire 16-character password

**For Hostinger:**
- Verify your email password is correct
- Make sure the email account exists in your Hostinger panel
- Try SMTP port 465 instead of 587

**For all providers:**
- Check your internet connection
- Make sure the email address is typed correctly
- Try disabling and re-enabling email notifications

### "Test email sent but I didn't receive it"

- Check your spam/junk folder
- Wait a few minutes (sometimes emails are delayed)
- Make sure the email address is correct
- Try sending to a different email address

### "Emails not sending automatically"

- Make sure "Enable Email Notifications" is checked
- Click "Save Email Settings" after making changes
- Check that clients have email addresses in their profiles
- Look at server logs for error messages

### "Client has no email address"

When adding a client/pet, make sure to fill in the **Email** field. You can edit existing clients to add their email.

---

## Email Templates

### Booking Confirmation
Sent when a client books online. Includes:
- Appointment details
- Groomer name
- Service and price
- Your shop contact info
- Note that they must call to cancel/reschedule

### Appointment Reminder
Manually sent from admin panel. Includes:
- "Tomorrow's Appointment" notice
- All appointment details
- Request to call if they need to cancel

### Cancellation Notice
Sent when you cancel from admin panel. Includes:
- Notification that appointment was cancelled
- Original appointment details
- Invitation to call and rebook

---

## Best Practices

### When to Send Reminders
- Day before the appointment
- Morning of the appointment (for afternoon appointments)
- For new clients or no-show risks

### Email Etiquette
- Keep your shop name professional
- Include a working phone number
- Test emails before going live
- Check spam folder occasionally

### Privacy
- Emails only go to the client who owns the pet
- No client data is shared
- Passwords are stored securely in the database
- Only you can access email settings

---

## FAQ

**Q: Can I customize the email templates?**  
A: Currently, templates are fixed but include your shop name and phone. Custom templates can be added in a future update.

**Q: Do I need a paid email service?**  
A: No! Gmail is free. Hostinger email comes with your hosting plan.

**Q: Will emails work if my computer is off?**  
A: No - the server must be running to send emails. Consider running PAWS as a service (see main README).

**Q: Can I use multiple email addresses?**  
A: One email address per shop. Each shop clone can use a different email.

**Q: What if a client doesn't have an email?**  
A: No problem - they just won't receive automated emails. You can still call them.

**Q: Are emails sent for appointments booked by phone?**  
A: Currently, only online bookings trigger automatic emails. You can manually send reminders from the admin panel.

---

## Security Notes

- **Never share your app password** with anyone
- **Don't use your main email password** - use an app password (Gmail) or create a dedicated email account
- **Passwords are stored in the database** - keep your database backed up and secure
- **Use HTTPS** when accessing the admin panel over the internet

---

## Support

If you're having trouble setting up email:

1. Check this guide again
2. Try the "Test Connection" button
3. Check server logs: `cat server.log`
4. Make sure email settings are saved
5. Verify your email credentials are correct

---

**Ready to send professional emails!** 📧🐾

Your clients will love getting instant confirmations and reminders.
