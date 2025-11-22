# 🐾 Paws Grooming Scheduler

A complete online booking and management system for pet grooming businesses, built by a groomer for groomers.

## Features

### For Groomers (Admin Panel)
- **Client & Pet Management** - Add clients, register pets, assign eligible services
- **Appointment Management** - View, schedule, complete, and cancel appointments
- **Service Management** - Create, edit, and delete services with custom pricing
- **Groomer Scheduling** - Set weekly schedules for multiple groomers
- **Dashboard** - Quick overview of today's appointments and business stats
- **PIN System** - Automatic generation of unique 5-digit PINs for each pet

### For Clients (Booking Portal)
- **Simple Booking Flow** - Enter PIN → Confirm Pet → Select Service → Pick Time Slot
- **Groomer Selection** - See which groomer is available for each time slot
- **Price Transparency** - View service prices before booking
- **Appointment Confirmation** - Instant confirmation with all booking details

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: SQLite (portable, no setup required)
- **Frontend**: Vanilla JavaScript with modern dark theme UI
- **Styling**: Custom CSS with vibrant accent colors

## Installation

### Prerequisites

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **Git** (optional, for cloning) - [Download here](https://git-scm.com/)

### Quick Start

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/yourusername/paws.git
   cd paws
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   node server.js
   ```

4. **Access the application**
   - Admin Panel: http://localhost:3000/admin/
   - Client Booking: http://localhost:3000/book/
   - Admin PIN: `4921` (change this in `public/admin/admin.js`)

## Setup for Your Shop

### 1. Configure Your Services

1. Open the Admin Panel (http://localhost:3000/admin/)
2. Login with PIN `4921`
3. Go to **Services** section
4. Edit existing services or create new ones with your pricing
5. Delete services you don't offer

### 2. Add Your Groomers

1. Go to **Groomers** section
2. Add each groomer on your team
3. Set their weekly schedule (working days and hours)

### 3. Add Your First Client

1. Go to **Clients & Pets** section
2. Click **+ New Client/Pet**
3. Fill in owner and pet information
4. System will generate a unique PIN for the pet
5. Give this PIN to the client for online booking

### 4. Test Client Booking

1. Open http://localhost:3000/book/ (or share this URL with clients)
2. Enter the pet's PIN
3. Confirm the pet
4. Select a service
5. Pick an available time slot
6. Book the appointment

## Making It Available Online

To allow clients to book from anywhere (not just your local network), you need to expose your server to the internet.

### Option 1: Cloudflare Tunnel (Recommended - Free)

1. **Install Cloudflare Tunnel**
   ```bash
   # Download cloudflared
   # For Linux:
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   
   # For Windows: Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   ```

2. **Authenticate with Cloudflare**
   ```bash
   cloudflared tunnel login
   ```

3. **Create a tunnel**
   ```bash
   cloudflared tunnel create paws-grooming
   ```

4. **Run the tunnel**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

5. **Get your public URL** - Cloudflare will provide a URL like `https://random-name.trycloudflare.com`

6. **Share the booking URL** with clients: `https://your-tunnel-url.trycloudflare.com/book/`

### Option 2: ngrok (Free Tier Available)

1. **Install ngrok** - [Download here](https://ngrok.com/download)

2. **Start ngrok**
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Share with clients**: `https://abc123.ngrok.io/book/`

**Note**: Free ngrok URLs change each time you restart. Upgrade to a paid plan for a permanent URL.

## Running as a Background Service

### On Linux (systemd)

1. **Create a service file**
   ```bash
   sudo nano /etc/systemd/system/paws.service
   ```

2. **Add this content** (adjust paths as needed):
   ```ini
   [Unit]
   Description=Paws Grooming Scheduler
   After=network.target

   [Service]
   Type=simple
   User=yourusername
   WorkingDirectory=/path/to/paws
   ExecStart=/usr/bin/node server.js
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start the service**
   ```bash
   sudo systemctl enable paws
   sudo systemctl start paws
   sudo systemctl status paws
   ```

### On Windows

1. **Install node-windows**
   ```bash
   npm install -g node-windows
   ```

2. **Create a service script** (`install-service.js`):
   ```javascript
   var Service = require('node-windows').Service;
   var svc = new Service({
     name: 'Paws Grooming',
     description: 'Paws Grooming Scheduler',
     script: 'C:\\path\\to\\paws\\server.js'
   });
   svc.on('install', function(){
     svc.start();
   });
   svc.install();
   ```

3. **Run the installer**
   ```bash
   node install-service.js
   ```

## Backup Your Data

Your database is stored in `grooming.db`. To backup:

```bash
# Create a backup
cp grooming.db grooming.db.backup-$(date +%Y%m%d)

# Or use SQLite backup command
sqlite3 grooming.db ".backup grooming.db.backup"
```

**Recommended**: Set up automatic daily backups using cron (Linux) or Task Scheduler (Windows).

## Customization

### Change Admin PIN

Edit `public/admin/admin.js` and change this line:
```javascript
const ADMIN_PIN = '4921';  // Change to your desired PIN
```

### Customize Colors

Edit `public/css/theme.css` to change the color scheme:
```css
:root {
    --accent-blue: #00d4ff;
    --accent-green: #00ff88;
    --accent-purple: #b84fff;
    --accent-fuchsia: #ff00ff;
    --accent-orange: #ff6b35;
}
```

### Add Your Logo

Replace the 🐾 emoji in the HTML files with your logo image.

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Make sure Node.js is installed: `node --version`
- Verify dependencies are installed: `npm install`

### Can't access from other devices
- Make sure your firewall allows connections on port 3000
- Use a tunnel service (Cloudflare or ngrok) for internet access

### Database errors
- Check that `grooming.db` exists and has proper permissions
- Try running the database initialization: `node init_db.js`

### Appointments not showing
- Verify groomer schedules are set up correctly
- Check that services are assigned to pets
- Ensure the appointment date is in the future

## Support

This is a custom-built application designed for independent grooming businesses. For issues or questions:

1. Check the troubleshooting section above
2. Review the database schema in `init_db.js`
3. Check server logs for error messages

## License

This project is provided as-is for use by grooming businesses. Feel free to modify and customize for your needs.

---

**Built with ❤️ by groomers, for groomers.**
