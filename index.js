const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
require('dotenv').config();
const port = Number(process.env.PORT) || 3000;

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
        
        // Execute git pull and pm2 restart with the specified instance number
        executeCommands(instanceNumber);
        
        return res.status(200).send(`Webhook received successfully for PM2 instance ${instanceNumber}`);
    }
    
    // For other events
    res.status(200).send('Event received');
});

// Function to execute git pull and pm2 restart for a specific instance
function executeCommands(instanceNumber) {
    // Get the working directory of the PM2 process
    exec(`pm2 jlist`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error getting PM2 process list: ${error}`);
            return;
        }
        
        try {
            const processes = JSON.parse(stdout);
            const process = processes.find(p => p.pm_id == instanceNumber);
            
            if (!process) {
                console.error(`PM2 process with ID ${instanceNumber} not found`);
                return;
            }
            
            const workingDir = process.pm2_env.pm_cwd;
            console.log(`Working directory for PM2 process ${instanceNumber}: ${workingDir}`);
            
            // Check if the working directory is a git repository
            fs.access(`${workingDir}/.git`, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error(`The directory ${workingDir} is not a git repository`);
                    return;
                }
                
                // Execute git pull in the working directory
                console.log(`Pulling latest changes from Git...`);
                exec('git pull', { cwd: workingDir }, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error executing git pull: ${error}`);
                        return;
                    }
                    
                    console.log(`Git pull output: ${stdout}`);
                    
                    // Restart the PM2 process
                    console.log(`Restarting PM2 process ${instanceNumber}...`);
                    exec(`pm2 restart ${instanceNumber}`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error restarting PM2 process ${instanceNumber}: ${error}`);
                            return;
                        }
                        
                        console.log(`PM2 restart output: ${stdout}`);
                    });
                });
            });
        } catch (parseError) {
            console.error(`Error parsing PM2 process info: ${parseError}`);
        }
    });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

