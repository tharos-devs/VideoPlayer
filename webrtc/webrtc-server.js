const express = require('express');
const WebSocket = require('ws');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Configuration des binaires statiques FFmpeg avec fallback
function getFFmpegPath() {
    try {
        // Essayer d'abord le package ffmpeg-static
        const staticPath = require('ffmpeg-static');
        if (staticPath && fs.existsSync(staticPath)) {
            return staticPath;
        }
    } catch (e) {
        console.log('ffmpeg-static package not found, trying fallbacks...');
    }
    
    // Fallbacks pour différents environnements
    const fallbackPaths = [
        'ffmpeg', // Système PATH
        './node_modules/ffmpeg-static/ffmpeg', // Relatif local
        '../node_modules/ffmpeg-static/ffmpeg', // Relatif parent
        '/usr/bin/ffmpeg', // Linux système
        '/usr/local/bin/ffmpeg', // macOS Homebrew
        '/opt/homebrew/bin/ffmpeg' // macOS Apple Silicon
    ];
    
    for (const testPath of fallbackPaths) {
        try {
            const { execSync } = require('child_process');
            execSync(`"${testPath}" -version`, { stdio: 'ignore' });
            console.log(`Found working ffmpeg at: ${testPath}`);
            return testPath;
        } catch (e) {
            // Continuer au suivant
        }
    }
    
    throw new Error('FFmpeg not found in any location');
}

function getFFprobePath() {
    try {
        // Essayer d'abord le package ffprobe-static
        const staticPath = require('ffprobe-static').path;
        if (staticPath && fs.existsSync(staticPath)) {
            return staticPath;
        }
    } catch (e) {
        console.log('ffprobe-static package not found, trying fallbacks...');
    }
    
    // Fallbacks pour différents environnements
    const fallbackPaths = [
        'ffprobe', // Système PATH
        './node_modules/ffprobe-static/bin/ffprobe', // Relatif local
        '../node_modules/ffprobe-static/bin/ffprobe', // Relatif parent
        '/usr/bin/ffprobe', // Linux système
        '/usr/local/bin/ffprobe', // macOS Homebrew
        '/opt/homebrew/bin/ffprobe' // macOS Apple Silicon
    ];
    
    for (const testPath of fallbackPaths) {
        try {
            const { execSync } = require('child_process');
            execSync(`"${testPath}" -version`, { stdio: 'ignore' });
            console.log(`Found working ffprobe at: ${testPath}`);
            return testPath;
        } catch (e) {
            // Continuer au suivant
        }
    }
    
    throw new Error('FFprobe not found in any location');
}

const ffmpegPath = getFFmpegPath();
const ffprobePath = getFFprobePath();

// Debug flag - set to false for better performance (less console.log)
const ENABLE_DEBUG_LOGS = false;

console.log('📦 Using bundled FFmpeg binaries:');
console.log('   ffmpeg:', ffmpegPath);
console.log('   ffprobe:', ffprobePath);

// Helper function for conditional logging
function debugLog(message) {
    if (ENABLE_DEBUG_LOGS) {
        console.log(message);
    }
}

class WebRTCVideoStreamer {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        this.currentVideo = null;
        this.currentPosition = 0;
        this.isPlaying = false;
        this.ffmpegProcess = null;
        this.streamingInterval = null;
        this.clients = new Set();
        this.playStartTime = null; // Temps de démarrage de la lecture
        this.playStartPosition = 0; // Position au démarrage de la lecture
        this.videoDuration = 0; // Durée totale de la vidéo
        this.staticFrameProcess = null; // Processus FFmpeg pour frames statiques
        this.lastStateChange = Date.now(); // Timestamp de dernière modification d'état
        this.prewarmedProcess = null; // Processus FFmpeg pre-warmed pour latence ultra-basse
        this.shouldBroadcastFrames = false; // Contrôle si on diffuse les frames (pour pause sans tuer FFmpeg)
        
        this.setupServer();
        this.setupWebSocket();
        
        // Server ready message - immediate
        console.log('✅ WebRTC Server is ready to accept commands');
    }
    
    setupServer() {
        // Enhanced CORS headers for QML compatibility
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            res.header('Access-Control-Allow-Credentials', 'false');
            res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.header('Pragma', 'no-cache');
            res.header('Expires', '0');
            
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
        
        this.app.use(express.static('../public'));
        this.app.use(express.json()); // Pour parser le JSON des requêtes POST        
        
        // Video control endpoints
        this.app.get('/play/:timing?', (req, res) => {
            
            const timing = req.params.timing ? parseFloat(req.params.timing) : null;
            
            // Si un timing est spécifié, juste l'utiliser pour le tracking
            if (timing !== null && !isNaN(timing)) {
                this.currentPosition = timing;
                debugLog(`ENDPOINT: /play/${timing}s`);
            } else {
                debugLog(`ENDPOINT: /play`);
            }
            
            this.play();
            res.status(200).json({ok: true});
        });
        
        this.app.get('/pause', (req, res) => {
            debugLog('ENDPOINT: /pause (SPACEBAR)');
            
            
            this.pause();
            res.status(200).json({ok: true});
        });
        
        
        this.app.get('/seek/:time', (req, res) => {
            const time = parseFloat(req.params.time);
            
            
            
            this.seek(time);
            res.status(200).json({ok: true});
        });
        
        this.app.get('/set-video', (req, res) => {
            const videoPath = req.query.path;
            this.handleSetVideoRequest(videoPath, res);
        });
        
        
        this.app.get('/video-path', (req, res) => {
            res.status(200).json({path: this.currentVideo ? '/webrtc-stream' : null});
        });
        
        this.app.get('/status', (req, res) => {
            res.status(200).json({
                playing: this.isPlaying,
                position: this.currentPosition,
                video: this.currentVideo,
                duration: this.videoDuration
            });
        });
        
        
        
        this.app.get('/clear-video', (req, res) => {
            debugLog('ENDPOINT: /clear-video');
            this.clearVideo();
            res.status(200).json({ok: true});
        });
        
        this.app.get('/open-player', (req, res) => {
            debugLog('ENDPOINT: /open-player');
            // Signal à Tauri de maintenir la fenêtre ouverte
            const client = require('http');
            const postData = JSON.stringify({
                cmd: 'keep_window_open'
            });
            
            const options = {
                hostname: 'localhost',
                port: 1420, // Port par défaut de Tauri
                path: '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req2 = client.request(options, (res2) => {
                console.log('✅ Tauri window keep-alive signal sent');
            });
            
            req2.on('error', (e) => {
                console.log('⚠️ Could not signal Tauri:', e.message);
            });
            
            req2.write(postData);
            req2.end();
            
            res.status(200).json({ok: true, message: 'Player window keep-alive signal sent'});
        });
        
        
        // Simple ready check for QML (text response)
        this.app.get('/ready', (req, res) => {
            res.status(200).send('OK');
        });
        
    }
    
    setupWebSocket() {
        this.server = this.app.listen(5173, () => {
            console.log('WebRTC Video Server running on http://localhost:5173');
        });
        
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            console.log('Ready: no video');
            this.clients.add(ws);
            
            // Send current state to new client
            ws.send(JSON.stringify({
                type: 'state',
                video: this.currentVideo,
                position: this.currentPosition,
                playing: this.isPlaying
            }));
            
            ws.on('close', () => {
                console.log('Client disconnected');
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.log('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    setVideo(videoPath) {
        debugLog(`DEBUG: setVideo called with path: "${videoPath}"`);
        
        try {
            this.clearVideo();
            this.currentVideo = videoPath;
            this.currentPosition = 0;
            this.isPlaying = false;
            this.lastStateChange = Date.now();
            
            debugLog(`DEBUG: Video properties set, getting duration...`);
            
            // Obtenir la durée de la vidéo avec FFprobe
            this.getVideoDuration().then(duration => {
                debugLog(`DEBUG: Got video duration: ${duration}s`);
                this.videoDuration = duration;
                this.broadcast({
                    type: 'video_set',
                    path: videoPath,
                    duration: duration
                });
            }).catch(error => {
                console.log(`ERROR: Failed to get video duration: ${error.message}`);
            });
            
            debugLog(`DEBUG: Generating static frame...`);
            // Générer et afficher la première frame immédiatement
            this.generateStaticFrame();
            
            debugLog(`DEBUG: Pre-starting FFmpeg for instant play...`);
            // Pré-démarrer FFmpeg en arrière-plan pour latence ultra-basse au premier play
            this.shouldBroadcastFrames = false; // Ne pas diffuser, juste préparer
            this.startStreaming(false); // Ne pas forcer la diffusion
            
            debugLog(`DEBUG: setVideo completed successfully`);
        } catch (error) {
            console.log(`ERROR: Exception in setVideo: ${error.message}`);
            throw error;
        }
    }
    
    play() {
        if (!this.currentVideo) {
            console.log('ERROR: No video loaded');
            return;
        }
        
        this.isPlaying = true;
        this.playStartTime = Date.now();
        this.playStartPosition = this.currentPosition;
        this.lastStateChange = Date.now();
        
        // Broadcast IMMEDIATELY 
        this.broadcast({
            type: 'play',
            position: this.currentPosition
        });
        
        // Si FFmpeg est déjà en cours, reprendre la diffusion immédiatement
        if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
            debugLog('PLAY: Resuming frame broadcasting (FFmpeg already running)');
            this.shouldBroadcastFrames = true;
        } else {
            debugLog('PLAY: Starting new FFmpeg process');
            this.shouldBroadcastFrames = true;
            this.startStreaming();
        }
    }
    
    pause() {
        // Calculer la position actuelle basée sur le temps écoulé
        if (this.playStartTime) {
            const elapsedSeconds = (Date.now() - this.playStartTime) / 1000;
            this.currentPosition = this.playStartPosition + elapsedSeconds;
        }
        
        this.isPlaying = false;
        this.playStartTime = null;
        this.lastStateChange = Date.now();
        
        // IMPORTANT: Arrêter la diffusion des frames SANS tuer FFmpeg
        this.shouldBroadcastFrames = false;
        
        this.broadcast({
            type: 'pause',
            position: this.currentPosition
        });
        
        debugLog('PAUSE: FFmpeg kept alive, frames broadcasting stopped');
        
        // On garde FFmpeg en vie, on arrête juste la diffusion
        // La dernière frame reste affichée côté client
    }
    
    
    seek(time) {
        debugLog(`SEEK to ${time.toFixed(3)}s - isPlaying: ${this.isPlaying}`);

        // SEEK ne change JAMAIS l'état isPlaying - seulement la position
        this.currentPosition = time;
        this.lastStateChange = Date.now();
        
        // Pour seek, on doit toujours redémarrer FFmpeg à la nouvelle position
        this.stopStreaming();
        
        if (this.isPlaying) {
            // Réinitialiser le tracking pour la nouvelle position  
            this.playStartTime = Date.now();
            this.playStartPosition = time;
            
            // Redémarrer immédiatement à la nouvelle position
            this.startStreaming();
            debugLog('SEEK: FFmpeg restarted at new position (playing)');
        } else {
            // En pause : générer une frame statique à la nouvelle position
            this.generateStaticFrame();
            debugLog('SEEK: Static frame generated at new position (paused)');
        }
        
        this.broadcast({
            type: 'seek',
            position: time,
            playing: this.isPlaying
        });
    }
    
    // Méthodes pour obtenir les chemins FFmpeg/FFprobe de façon robuste
    getFFmpegPath() {
        return ffmpegPath; // Utilise la variable globale déjà initialisée
    }
    
    getFFprobePath() {
        return ffprobePath; // Utilise la variable globale déjà initialisée
    }
    
    startStreaming(forceBroadcast = true) {
        if (!this.currentVideo || !fs.existsSync(this.currentVideo)) {
            console.log('Video file not found for streaming');
            return;
        }
        
        this.stopStreaming(); // Ensure clean state
        
        
        const { spawn } = require('child_process');
        
        const ffmpegArgs = [
            '-ss', this.currentPosition.toFixed(3), // Seek before input for faster start (3 digits precision)
            '-re', // Read at native frame rate to avoid too fast playback
            '-i', this.currentVideo,
            '-f', 'image2pipe',
            '-vcodec', 'mjpeg',
            '-q:v', '8', // Good quality vs speed balance
            '-s', '640x360',
            '-an', // No audio needed
            '-fflags', '+fastseek+genpts+discardcorrupt', // Ultra-fast seeking
            '-avoid_negative_ts', 'make_zero',
            '-threads', '2', // Use multiple threads
            '-preset', 'ultrafast', // Fastest encoding
            '-tune', 'fastdecode', // Optimize for fast decoding
            'pipe:1'
        ];
        
        
        try {
            this.ffmpegProcess = spawn(this.getFFmpegPath(), ffmpegArgs);
            
            // Contrôler la diffusion selon le paramètre
            if (forceBroadcast) {
                this.shouldBroadcastFrames = true;
            }
            // Sinon on garde la valeur actuelle de shouldBroadcastFrames
            
            let frameBuffer = Buffer.alloc(0);
            const frameStart = Buffer.from([0xFF, 0xD8]); // JPEG start
            const frameEnd = Buffer.from([0xFF, 0xD9]);   // JPEG end
            
            this.ffmpegProcess.stdout.on('data', (chunk) => {
                frameBuffer = Buffer.concat([frameBuffer, chunk]);
                
                let startIndex = 0;
                let endIndex;
                
                while ((endIndex = frameBuffer.indexOf(frameEnd, startIndex)) !== -1) {
                    const frameData = frameBuffer.slice(startIndex, endIndex + 2);
                    
                    // Ne diffuser les frames que si on est en mode play
                    if (this.shouldBroadcastFrames) {
                        this.broadcast({
                            type: 'frame',
                            data: frameData.toString('base64'),
                            timestamp: Date.now()
                        });
                        
                    }
                    // Sinon on consomme les frames sans les diffuser (garde FFmpeg en vie)
                    
                    startIndex = endIndex + 2;
                }
                
                frameBuffer = frameBuffer.slice(startIndex);
            });
            
            this.ffmpegProcess.stderr.on('data', (data) => {
                // Logging moins verbeux
                const output = data.toString();
                if (output.includes('error') || output.includes('Error')) {
                    console.log('FFmpeg stderr:', output);
                }
            });
            
            this.ffmpegProcess.on('close', (code) => {
            });
            
        } catch (err) {
            console.log('Error starting FFmpeg process:', err.message);
        }
    }
    
    
    handleSetVideoRequest(videoPath, res) {
        debugLog(`DEBUG: handleSetVideoRequest called with path: "${videoPath}"`);
        
        // Check if video is already loaded and is the same file
        if (this.currentVideo === videoPath) {
            debugLog(`ENDPOINT: /set-video → "${videoPath}" (already loaded, ignoring)`);
            res.status(200).json({ok: true, status: 'already_loaded'});
            return;
        }
        
        // Check if file exists
        if (!require('fs').existsSync(videoPath)) {
            console.log(`ERROR: Video file not found: "${videoPath}"`);
            res.status(404).json({ok: false, error: 'File not found'});
            return;
        }
        
        // Load video only if different or no video loaded
        debugLog(`ENDPOINT: /set-video → "${videoPath}" (loading new video)`);
        
        try {
            this.setVideo(videoPath);
            res.status(200).json({ok: true, status: 'loaded'});
        } catch (error) {
            console.log(`ERROR: Failed to set video: ${error.message}`);
            res.status(500).json({ok: false, error: error.message});
        }
    }
    
    
    stopStreaming() {
        if (this.ffmpegProcess) {
            try {
                if (typeof this.ffmpegProcess.kill === 'function') {
                    this.ffmpegProcess.kill('SIGTERM');
                }
            } catch (err) {
                // Ignorer les erreurs de kill
            }
            this.ffmpegProcess = null;
        }
        
        // Nettoyer aussi le processus de frame statique s'il existe
        if (this.staticFrameProcess) {
            try {
                this.staticFrameProcess.kill('SIGTERM');
            } catch (err) {
                // Ignorer les erreurs
            }
            this.staticFrameProcess = null;
        }
    }
    
    // Nouvelle fonction: générer une frame statique à une position donnée
    async generateStaticFrame() {
        if (!this.currentVideo || !fs.existsSync(this.currentVideo)) {
            console.log('Cannot generate static frame: video file not found');
            return;
        }
        
        // Tuer l'ancien processus de génération de frame s'il existe
        if (this.staticFrameProcess) {
            try {
                this.staticFrameProcess.kill('SIGTERM');
            } catch (err) {
                // Ignorer les erreurs de kill
            }
            this.staticFrameProcess = null;
        }
        
        
        const { spawn } = require('child_process');
        
        const ffmpegArgs = [
            '-ss', this.currentPosition.toFixed(3),
            '-i', this.currentVideo,
            '-vframes', '1', // Une seule frame
            '-f', 'image2pipe',
            '-vcodec', 'mjpeg',
            '-q:v', '8',
            '-s', '640x360',
            'pipe:1'
        ];
        
        try {
            this.staticFrameProcess = spawn(this.getFFmpegPath(), ffmpegArgs);
            
            let frameBuffer = Buffer.alloc(0);
            
            this.staticFrameProcess.stdout.on('data', (chunk) => {
                frameBuffer = Buffer.concat([frameBuffer, chunk]);
            });
            
            this.staticFrameProcess.on('close', (code) => {
                if (code === 0 && frameBuffer.length > 0) {
                    // Diffuser la frame statique
                    this.broadcast({
                        type: 'frame', // Utiliser le même type que les frames normales
                        data: frameBuffer.toString('base64'),
                        position: this.currentPosition,
                        timestamp: Date.now()
                    });
                }
                this.staticFrameProcess = null;
            });
            
            this.staticFrameProcess.stderr.on('data', (data) => {
                // Ignorer les messages d'erreur FFmpeg pour les frames statiques
            });
            
        } catch (err) {
            console.log('Error generating static frame:', err.message);
            this.staticFrameProcess = null;
        }
    }
    
    // Obtenir la durée de la vidéo avec FFprobe
    async getVideoDuration() {
        if (!this.currentVideo || !fs.existsSync(this.currentVideo)) {
            return 0;
        }
        
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
            
            const ffprobe = spawn(this.getFFprobePath(), [
                '-v', 'quiet',
                '-show_entries', 'format=duration',
                '-of', 'csv=p=0',
                this.currentVideo
            ]);
            
            let output = '';
            
            ffprobe.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            ffprobe.on('close', (code) => {
                if (code === 0 && output.trim()) {
                    const duration = parseFloat(output.trim());
                    console.log(`Video duration: ${duration.toFixed(2)}s`);
                    resolve(duration);
                } else {
                    console.log('Could not get video duration');
                    resolve(0);
                }
            });
            
            ffprobe.on('error', (err) => {
                console.log('FFprobe error:', err.message);
                resolve(0);
            });
        });
    }
    
    clearVideo() {
        this.stopStreaming();
        this.currentVideo = null;
        this.currentPosition = 0;
        this.isPlaying = false;
        this.playStartTime = null;
        this.playStartPosition = 0;
        this.videoDuration = 0;
        this.shouldBroadcastFrames = false;
        
        // Nettoyer le processus de frame statique
        if (this.staticFrameProcess) {
            try {
                this.staticFrameProcess.kill('SIGTERM');
            } catch (err) {
                // Ignorer les erreurs
            }
            this.staticFrameProcess = null;
        }
        
        this.broadcast({
            type: 'clear'
        });
        
        console.log('Video cleared');
    }
    
    // Méthode pour exécuter les commandes
    executeCommand(action, time) {
        switch (action) {
            case 'play':
                this.play();
                break;
            case 'pause':
                this.pause();
                break;
            case 'seek':
                if (time !== undefined) {
                    this.seek(time);
                }
                break;
        }
    }
    
}

// Start WebRTC server
const streamer = new WebRTCVideoStreamer();

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('Shutting down WebRTC server...');
    streamer.clearVideo();
    process.exit(0);
});