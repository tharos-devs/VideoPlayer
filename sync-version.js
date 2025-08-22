#!/usr/bin/env node

/**
 * Script pour synchroniser les versions depuis tauri.conf.json
 * Usage: node sync-version.js
 */

const fs = require('fs');
const path = require('path');

// Lire la version depuis tauri.conf.json (source de vérité)
const tauriConfig = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const masterVersion = tauriConfig.package.version;

console.log(`📦 Version maître depuis tauri.conf.json: ${masterVersion}`);

// Liste des fichiers à synchroniser
const filesToSync = [
    {
        file: 'package.json',
        type: 'json',
        path: ['version']
    },
    {
        file: 'webrtc/package.json', 
        type: 'json',
        path: ['version']
    },
    {
        file: 'plugins/VideoPlayer.qml',
        type: 'qml',
        pattern: /version: "([^"]+)"/,
        replacement: `version: "${masterVersion}"`
    },
    {
        file: 'public/index.html',
        type: 'html',
        pattern: /VideoPlayer v[\d.]+/,
        replacement: `VideoPlayer v${masterVersion}`
    }
];

let updatedFiles = 0;

filesToSync.forEach(item => {
    const filePath = item.file;
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Fichier non trouvé: ${filePath}`);
        return;
    }

    try {
        if (item.type === 'json') {
            // Traitement JSON
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const oldVersion = data[item.path[0]];
            
            if (oldVersion !== masterVersion) {
                data[item.path[0]] = masterVersion;
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
                console.log(`✅ ${filePath}: ${oldVersion} → ${masterVersion}`);
                updatedFiles++;
            } else {
                console.log(`✓ ${filePath}: déjà à jour (${masterVersion})`);
            }
        } else {
            // Traitement texte (QML, HTML, etc.)
            let content = fs.readFileSync(filePath, 'utf8');
            const match = content.match(item.pattern);
            
            if (match && match[1] !== masterVersion) {
                content = content.replace(item.pattern, item.replacement);
                fs.writeFileSync(filePath, content);
                console.log(`✅ ${filePath}: ${match[1]} → ${masterVersion}`);
                updatedFiles++;
            } else if (match && match[1] === masterVersion) {
                console.log(`✓ ${filePath}: déjà à jour (${masterVersion})`);
            } else {
                console.log(`⚠️  ${filePath}: pattern non trouvé`);
            }
        }
    } catch (error) {
        console.log(`❌ Erreur avec ${filePath}: ${error.message}`);
    }
});

console.log(`\n🎉 Synchronisation terminée: ${updatedFiles} fichier(s) mis à jour`);