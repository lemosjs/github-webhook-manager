# GitHub Webhook Manager

A simple Express.js server that listens for GitHub webhooks and automatically pulls the latest changes and restarts the application using PM2.

## Features

- Receives GitHub webhook events for repository pushes (commits)
- Automatically runs `pm2 pull` to fetch the latest changes
- Restarts the specified PM2 instance using the instance number
- Supports multiple PM2 instances through query parameters

## Setup

1. Install dependencies:
   ```
   npm install express body-parser
   ```

2. Make sure your PM2 applications are set up with Git integration:
   ```
   pm2 start app.js --name="app" --watch --source-map-support --time -- [args]
   ```
   
   Or in your ecosystem.config.js:
   ```javascript
   module.exports = {
     apps: [{
       name: "app",
       script: "app.js",
       watch: true,
       source_map_support: true,
       time: true,
       args: "[args]",
       // Add your repository URL for pm2 pull to work
       repo: "https://github.com/username/repo.git",
       // Branch to pull from
       branch: "main"
     }]
   }
   ```

3. Start the webhook server:
   ```
   node index.js
   ```
   
   Or with PM2:
   ```
   pm2 start index.js --name="webhook-server"
   ```

## Configuring GitHub Webhooks

1. Go to your GitHub repository
2. Navigate to Settings > Webhooks
3. Click "Add webhook"
4. Set the Payload URL to your server's address with the PM2 instance number:
   - For instance 0 (default): `http://your-server-address:3000/webhook`
   - For instance 1: `http://your-server-address:3000/webhook?number=1`
   - For instance 2: `http://your-server-address:3000/webhook?number=2`
   - And so on for other instances
5. Set Content type to `application/json`
6. Select "Just the push event" (or choose which events you want to trigger the webhook)
7. Ensure "Active" is checked
8. Click "Add webhook"

## Usage Examples

- To update and restart PM2 instance 0 (default):
  ```
  POST http://your-server-address:3000/webhook
  ```

- To update and restart PM2 instance 1:
  ```
  POST http://your-server-address:3000/webhook?number=1
  ```

- To update and restart PM2 instance 2:
  ```
  POST http://your-server-address:3000/webhook?number=2
  ```

## Troubleshooting

If the webhook is not working:

1. Check the server logs for error messages
2. Ensure your server is accessible from the internet
3. Verify that the correct PM2 instance number is specified in the webhook URL
4. Make sure your PM2 applications have the Git repository configured correctly
5. Check GitHub's webhook delivery logs for any failed attempts 

#  How to setup NGINX

# Nginx Reverse Proxy Setup Guide

This guide walks through setting up an Nginx reverse proxy server listening on port 3003 and forwarding to a service on port 3004.

## Prerequisites

- Ubuntu/Debian server
- Root or sudo access
- Nginx installed (`sudo apt install nginx`)

## Step 1: Create the Nginx Configuration File

Create a new configuration file in the Nginx sites directory:

```bash
sudo nano /etc/nginx/sites-available/reverse-proxy
```

## Step 2: Add the Configuration

Paste the following configuration:

```nginx
server {
    listen 0.0.0.0:3000;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Optional: Increase timeout if needed
        proxy_connect_timeout 90;
        proxy_send_timeout 90;
        proxy_read_timeout 90;
        send_timeout 90;
    }
}
```

Save and exit the editor (Ctrl+X, then Y, then Enter in nano).

## Step 3: Enable the Configuration

Create a symbolic link to enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/reverse-proxy /etc/nginx/sites-enabled/
```

## Step 4: Test & Reload Nginx

Test the configuration for syntax errors:

```bash
sudo nginx -t
```

If the test passes, reload Nginx:

```bash
sudo systemctl reload nginx
```

## Step 5: Configure Firewall

Ensure port 3000 is open in the firewall:

```bash
sudo ufw allow 3000/tcp
sudo ufw status
```

If using a different firewall or cloud provider security group, make sure to open port 3003 there as well.

## Step 6: Verify the Setup

From the server, test local access:

```bash
curl localhost:3000
```

From another machine, test remote access:

```bash
curl http://YOUR_SERVER_IP:3000
```

## Troubleshooting

If you can access the service locally but not remotely:

1. **Check firewall settings**:
   ```bash
   sudo ufw status
   ```

2. **Verify the server is binding to all interfaces** (the `0.0.0.0:3000` in the config)

3. **Check Nginx error logs**:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Ensure your service on port 3000 is running**:
   ```bash
   curl localhost:3000
   ```

5. **Check if your cloud provider (AWS, Digital Ocean, etc.) has additional firewall settings** that might be blocking the port.

## Notes

- Replace `http://localhost:3000` with the actual service you want to proxy to
- Adjust timeout values as needed for your application
- For production environments, consider adding rate limiting and additional security headers 