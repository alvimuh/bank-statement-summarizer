#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

const logDir = path.join(__dirname, '../logs');

async function viewLogs() {
  try {
    // Check if logs directory exists
    if (!await fs.pathExists(logDir)) {
      console.log('No logs directory found. Run the application first to generate logs.');
      return;
    }

    // Get all log files
    const files = await fs.readdir(logDir);
    const logFiles = files.filter(file => file.endsWith('.log')).sort();

    if (logFiles.length === 0) {
      console.log('No log files found.');
      return;
    }

    console.log('📋 Available log files:');
    logFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });

    // Show the most recent log file
    const mostRecentFile = logFiles[logFiles.length - 1];
    const logPath = path.join(logDir, mostRecentFile);
    
    console.log(`\n📄 Most recent log file: ${mostRecentFile}`);
    console.log('=' .repeat(80));

    const content = await fs.readFile(logPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Show last 50 lines by default
    const recentLines = lines.slice(-50);
    
    recentLines.forEach(line => {
      console.log(line);
    });

    console.log('\n💡 To view more lines, run: node scripts/view-logs.js --lines=100');
    console.log('💡 To view a specific file, run: node scripts/view-logs.js --file=filename.log');

  } catch (error) {
    console.error('Error viewing logs:', error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const linesArg = args.find(arg => arg.startsWith('--lines='));
const fileArg = args.find(arg => arg.startsWith('--file='));

if (linesArg) {
  const lines = parseInt(linesArg.split('=')[1]) || 50;
  console.log(`Showing last ${lines} lines...`);
}

if (fileArg) {
  const filename = fileArg.split('=')[1];
  console.log(`Showing specific file: ${filename}`);
}

viewLogs(); 