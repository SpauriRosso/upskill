/**
 * Simple build script to copy files from src to root directory
 */

// This would typically use a build tool like webpack, rollup, or parcel
// For simplicity, we're using a script that can be run with Node.js

const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Copy a file from source to destination
function copyFile(source, destination) {
    fs.copyFileSync(source, destination);
    console.log(`Copied: ${source} -> ${destination}`);
}

// Copy a directory recursively
function copyDirectory(source, destination) {
    ensureDirectoryExists(destination);
    
    const files = fs.readdirSync(source);
    
    for (const file of files) {
        const sourcePath = path.join(source, file);
        const destPath = path.join(destination, file);
        
        const stats = fs.statSync(sourcePath);
        
        if (stats.isDirectory()) {
            copyDirectory(sourcePath, destPath);
        } else {
            copyFile(sourcePath, destPath);
        }
    }
}

// Main build function
function build() {
    console.log('Building project...');
    
    // Copy HTML file
    copyFile('src/index.html', 'index.html');
    
    // Create js directory in root if it doesn't exist
    ensureDirectoryExists('js');
    
    // Copy js files
    copyDirectory('src/js', 'js');
    
    // Create css directory in root if it doesn't exist
    ensureDirectoryExists('css');
    
    // Copy css files
    copyDirectory('src/css', 'css');
    
    console.log('Build completed successfully!');
}

// Run the build
build();