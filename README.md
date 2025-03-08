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