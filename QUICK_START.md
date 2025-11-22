# Quick Start Guide - Paws Grooming Scheduler

## For Shop Owners - Get Running in 10 Minutes

### Step 1: Install Node.js (5 minutes)

1. Go to https://nodejs.org/
2. Download the LTS (Long Term Support) version
3. Run the installer
4. Accept all defaults
5. Restart your computer

### Step 2: Set Up Paws (2 minutes)

1. Extract the `paws` folder to your computer (e.g., `C:\paws` on Windows or `/home/yourname/paws` on Linux)
2. Open Terminal (Mac/Linux) or Command Prompt (Windows)
3. Navigate to the paws folder:
   ```bash
   cd C:\paws
   # or on Mac/Linux:
   cd /home/yourname/paws
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

### Step 3: Start the Server (1 minute)

```bash
node server.js
```

You should see:
```
Server is running at http://localhost:3000
Successfully connected to the database.
```

### Step 4: Access the Admin Panel (2 minutes)

1. Open your web browser
2. Go to: http://localhost:3000/admin/
3. Enter PIN: `4921`
4. You're in!

---

## First-Time Setup Checklist

### ✅ Customize Your Services

1. Click **Services** in the left menu
2. Review the default services
3. **Edit prices** to match your shop
4. **Delete** services you don't offer
5. **Add** any custom services

**Example**: If you charge $50 for a small dog bath instead of $45:
- Click "Edit" on "Small Bath + Nails Only"
- Change price from 45 to 50
- Click "Update Service"

### ✅ Add Your Groomers

1. Click **Groomers** in the left menu
2. Click **+ New Groomer**
3. Enter groomer name
4. Click "Add Groomer"
5. Click "Edit Schedule"
6. Select working days (check the boxes)
7. Set start and end times
8. Click "Update Schedule"

**Example**: If Sarah works Monday-Friday, 9am-5pm:
- Add groomer "Sarah"
- Edit schedule
- Check Mon, Tue, Wed, Thu, Fri
- Start time: 09:00
- End time: 17:00
- Save

### ✅ Add Your First Client

1. Click **Clients & Pets** in the left menu
2. Click **+ New Client/Pet**
3. Fill in:
   - Owner name
   - Phone number
   - Email (optional)
   - Pet name
   - Animal type (dog or cat)
   - Breed, weight, age
   - Any special notes
4. Click "Create Client & Pet"
5. **Write down the PIN** that appears!

**Important**: Give this PIN to the client - they'll use it to book online.

### ✅ Test Client Booking

1. Open a new browser tab
2. Go to: http://localhost:3000/book/
3. Enter the PIN you just created
4. Confirm the pet
5. Select a service
6. Pick a time slot
7. Book the appointment

**Success!** You should see a confirmation screen.

---

## Making It Available to Clients Online

Right now, the booking page only works on your computer. To let clients book from home:

### Option 1: Cloudflare Tunnel (Free, Permanent URL)

**Best for**: Shops that want a reliable, free solution

1. Download Cloudflare Tunnel:
   - Windows: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   - Mac: `brew install cloudflare/cloudflare/cloudflared`
   - Linux: `wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared-linux-amd64.deb`

2. Open a new terminal/command prompt window

3. Run:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

4. Look for a line like:
   ```
   https://random-words-1234.trycloudflare.com
   ```

5. Share this URL with clients: `https://random-words-1234.trycloudflare.com/book/`

**Keep this terminal window open** while clients are booking!

### Option 2: ngrok (Free Trial, Easy Setup)

**Best for**: Quick testing or occasional use

1. Sign up at https://ngrok.com/ (free)
2. Download ngrok
3. Run:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Share with clients: `https://abc123.ngrok.io/book/`

**Note**: Free ngrok URLs change every time you restart.

---

## Daily Operations

### Starting the Server Each Day

1. Open Terminal/Command Prompt
2. Navigate to paws folder:
   ```bash
   cd C:\paws
   ```
3. Start server:
   ```bash
   node server.js
   ```
4. Leave this window open all day

### Viewing Today's Appointments

1. Open http://localhost:3000/admin/
2. Login with PIN `4921`
3. Dashboard shows today's appointments

### Marking Appointments Complete

1. Go to **Appointments** section
2. Find the appointment
3. Click "Mark Completed"

### Adding a Walk-In Client

1. Go to **Clients & Pets**
2. Click **+ New Client/Pet**
3. Fill in details
4. Give them the PIN for future bookings

---

## Tips for Success

### 🔒 Security

- **Change the admin PIN** in `public/admin/admin.js` (line 3)
- Don't share your admin PIN with clients
- Only share the booking URL (`/book/`), not the admin URL (`/admin/`)

### 💾 Backup Your Data

Your client and appointment data is in `grooming.db`. Back it up weekly:

**Windows**:
```bash
copy grooming.db grooming.db.backup
```

**Mac/Linux**:
```bash
cp grooming.db grooming.db.backup
```

### 📱 Mobile-Friendly

The client booking page works great on phones! Clients can book from anywhere.

### ⏰ Appointment Reminders

Currently, clients must call to cancel/reschedule. Consider:
- Sending them a text reminder the day before
- Including your phone number on the confirmation screen

---

## Common Questions

**Q: Can I run this on my shop computer?**  
A: Yes! Any computer with Node.js can run it.

**Q: What if my computer restarts?**  
A: You'll need to start the server again. See "Running as a Background Service" in the main README for auto-start setup.

**Q: Can multiple groomers use the admin panel?**  
A: Yes, but they'll all use the same PIN. The system tracks which groomer each appointment is with.

**Q: How do I change prices later?**  
A: Go to Admin → Services → Edit any service → Update price

**Q: What if I lose a client's PIN?**  
A: Go to Admin → Clients & Pets → Search for the client → The PIN is shown next to each pet

**Q: Can clients see other clients' information?**  
A: No! Clients only see their own pet's name and available services. All other data is private.

---

## Need Help?

1. Check the main README.md for detailed documentation
2. Check server.log for error messages
3. Make sure Node.js is installed: `node --version`
4. Make sure the server is running: look for "Server is running" message

---

**You're ready to go! 🎉**

Start adding your clients and let them book online. No more phone tag!
