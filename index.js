const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;

// Middleware to parse JSON payloads
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});

// GitHub webhook endpoint - with PM2 instance number support
app.post('/webhook', (req, res) => {
    const event = req.headers['x-github-event'];
    // Get the PM2 instance number from query parameter, default to 0 if not provided
    const instanceNumber = req.query.number || 0;
    
    // Handle push events (commits)
    if (event === 'push') {
        console.log(`Received push event from GitHub for PM2 instance ${instanceNumber}`);
        
        // Execute pm2 pull and pm2 restart with the specified instance number
        executeCommands(instanceNumber);
        
        return res.status(200).send(`Webhook received successfully for PM2 instance ${instanceNumber}`);
    }
    
    // For other events
    res.status(200).send('Event received');
});

// Function to execute pm2 pull and pm2 restart for a specific instance
function executeCommands(instanceNumber) {
    console.log(`Pulling latest changes for PM2 process ${instanceNumber}...`);
    exec(`pm2 pull ${instanceNumber}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing pm2 pull for process ${instanceNumber}: ${error}`);
            return;
        }
        
        console.log(`PM2 pull output: ${stdout}`);
        
        console.log(`Restarting PM2 process ${instanceNumber}...`);
        exec(`pm2 restart ${instanceNumber}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error restarting PM2 process ${instanceNumber}: ${error}`);
                return;
            }
            
            console.log(`PM2 restart output: ${stdout}`);
        });
    });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

