const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataDir = path.join(__dirname, 'data');
const configPath = path.join(dataDir, 'config.json');
const logsPath = path.join(dataDir, 'shift_logs.csv');

// Create default config if it doesn't exist
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({
        supervisors: [],
        colleagues: [],
        fixedTasks: [
            "Checked all IDF rooms",
            "Checked IPTV Channels",
            "Check All Hosts Health & Storage",
            "Checked Landline"
        ]
    }, null, 2));
}

// Csv writer setup
const csvWriter = createObjectCsvWriter({
    path: logsPath,
    header: [
        { id: 'date', title: 'DATE' },
        { id: 'shift', title: 'SHIFT' },
        { id: 'taskArea', title: 'TASK_TYPE' },
        { id: 'description', title: 'DESCRIPTION' },
        { id: 'time', title: 'COMPLETION_TIME' },
        { id: 'status', title: 'STATUS' }
    ],
    append: fs.existsSync(logsPath) // append if exists
});

// GET Config
app.get('/api/config', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read config' });
    }
});

// Update Config
app.post('/api/config', (req, res) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save config' });
    }
});

// Save day logs
app.post('/api/save-logs', async (req, res) => {
    try {
        const { logs } = req.body; // array of task logs
        if (logs && logs.length > 0) {
            await csvWriter.writeRecords(logs);
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to write logs' });
    }
});

// Send/Draft Email via PowerShell
app.post('/api/send-email', (req, res) => {
    const { to, cc, subject, body, action } = req.body;
    
    // Create a temporary JSON file to pass to PowerShell script (avoids character escaping issues)
    const tempEmailDataPath = path.join(dataDir, 'temp_email.json');
    fs.writeFileSync(tempEmailDataPath, JSON.stringify({ to, cc, subject, body, action }));

    const psScriptPath = path.join(__dirname, 'scripts', 'send-outlook.ps1');
    const command = `powershell.exe -ExecutionPolicy Bypass -File "${psScriptPath}" "${tempEmailDataPath}"`;

    exec(command, (error, stdout, stderr) => {
        // Delete the temp file
        if (fs.existsSync(tempEmailDataPath)) {
            fs.unlinkSync(tempEmailDataPath);
        }

        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: 'Failed to integrate with Outlook', details: stderr });
        }
        res.json({ success: true, message: 'Email action completed successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
