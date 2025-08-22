const express = require('express');
const WebSocket = require('ws');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Configuration des binaires statiques FFmpeg
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

console.log('📦 Using bundled FFmpeg binaries:');
console.log('   ffmpeg:', ffmpegPath);
console.log('   ffprobe:', ffprobePath);

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
        this.lastCommand = null;  // Pour stocker la dernière commande
        this.playStartTime = null; // Temps de démarrage de la lecture
        this.playStartPosition = 0; // Position au démarrage de la lecture
        this.videoDuration = 0; // Durée totale de la vidéo
        this.staticFrameProcess = null; // Processus FFmpeg pour frames statiques
        this.lastPlayTime = 0; // Timestamp du dernier /play pour ignorer les /seek rapides
        this.isReady = false; // Serveur prêt pour les commandes
        this.pendingSetVideoRequests = []; // Queue pour les requêtes /set-video en attente
        
        this.setupServer();
        this.setupWebSocket();
        
        // Marquer comme prêt après l'initialisation
        setTimeout(() => {
            this.isReady = true;
            console.log('✅ WebRTC Server is ready to accept commands');
            this.processPendingSetVideoRequests();
        }, 2000); // 2 secondes pour s'assurer que tout est initialisé
    }
    
    setupServer() {
        // Add CORS headers for cross-origin requests
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            
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
            // Marquer le timestamp du /play pour ignorer les /seek rapides
            this.lastPlayTime = Date.now();
            
            const timing = req.params.timing ? parseFloat(req.params.timing) : null;
            
            // Si un timing est spécifié, positionner la vidéo d'abord
            if (timing !== null && !isNaN(timing)) {
                this.seek(timing);
                console.log(`ENDPOINT: /play/${timing}s`);
                // Stocker la commande avec le timing pour Tauri
                this.lastCommand = { action: "play", time: timing };
            } else {
                console.log(`ENDPOINT: /play`);
                // Stocker la commande sans timing pour Tauri
                this.lastCommand = { action: "play", time: null };
            }
            
            this.play();
            res.status(200).json({ok: true});
        });
        
        this.app.get('/pause', (req, res) => {
            console.log('ENDPOINT: /pause (SPACEBAR)');
            
            // Stocker la commande pour que Tauri puisse la récupérer
            this.lastCommand = { action: "pause", time: null };
            
            this.pause();
            res.status(200).json({ok: true});
        });
        
        
        this.app.get('/seek/:time', (req, res) => {
            const time = parseFloat(req.params.time);
            
            // Vérifier si un /play a eu lieu dans les 200ms précédentes
            const timeSinceLastPlay = Date.now() - this.lastPlayTime;
            if (timeSinceLastPlay < 200) {
                console.log(`SEEK IGNORED: ${time}s (${timeSinceLastPlay}ms after /play)`);
                res.status(200).json({ok: true, ignored: true});
                return;
            }
            
            // Stocker la commande pour que Tauri puisse la récupérer
            this.lastCommand = { action: "seek", time: time };
            
            this.seek(time);
            res.status(200).json({ok: true});
        });
        
        this.app.get('/set-video', (req, res) => {
            const videoPath = req.query.path;
            
            // Si le serveur n'est pas encore prêt, mettre en queue
            if (!this.isReady) {
                console.log(`ENDPOINT: /set-video → "${videoPath}" (server not ready, queuing request)`);
                this.pendingSetVideoRequests.push({ videoPath, res });
                return;
            }
            
            this.handleSetVideoRequest(videoPath, res);
        });
        
        this.app.get('/command', (req, res) => {
            // Retourne et efface la dernière commande (comme l'ancien serveur HTML5)
            const command = this.lastCommand;
            this.lastCommand = null;
            // Pas de log pour éviter la redondance avec les autres endpoints
            res.status(200).json(command || {});
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
        
        this.app.get('/player-ready', (req, res) => {
            res.status(200).json({ ready: this.isReady });
        });
        
        
        this.app.get('/clear-video', (req, res) => {
            console.log('ENDPOINT: /clear-video');
            this.clearVideo();
            res.status(200).json({ok: true});
        });
        
        // State endpoint for HTTP polling mode
        this.app.get('/state', (req, res) => {
            res.status(200).json({
                video: this.currentVideo,
                position: this.currentPosition,
                playing: this.isPlaying,
                duration: this.videoDuration
            });
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
        this.clearVideo();
        this.currentVideo = videoPath;
        this.currentPosition = 0;
        this.isPlaying = false;
        
        
        // Obtenir la durée de la vidéo avec FFprobe
        this.getVideoDuration().then(duration => {
            this.videoDuration = duration;
            this.broadcast({
                type: 'video_set',
                path: videoPath,
                duration: duration
            });
        });
        
        // Générer et afficher la première frame
        setTimeout(() => {
            this.generateStaticFrame();
        }, 100); // Petit délai pour s'assurer que tout est initialisé
    }
    
    play() {
        const stack = new Error().stack;
        if (!this.currentVideo) {
            console.log('ERROR: No video loaded');
            return;
        }
        
        this.isPlaying = true;
        this.playStartTime = Date.now();
        this.playStartPosition = this.currentPosition;
        
        this.broadcast({
            type: 'play',
            position: this.currentPosition
        });
        
        this.startStreaming();
    }
    
    pause() {
        // Calculer la position actuelle basée sur le temps écoulé
        if (this.playStartTime) {
            const elapsedSeconds = (Date.now() - this.playStartTime) / 1000;
            this.currentPosition = this.playStartPosition + elapsedSeconds;
        }
        
        this.isPlaying = false;
        this.playStartTime = null;
        
        this.broadcast({
            type: 'pause',
            position: this.currentPosition
        });
        
        this.stopStreaming();
        
        // Ne pas générer de frame statique - garder la dernière frame de streaming
        // Cela évite l'effet de "retour en arrière" visual
    }
    
    
    seek(time) {
        

        // SEEK ne change JAMAIS l'état isPlaying - seulement la position
        this.currentPosition = time;
        
        // Si vidéo était en cours de lecture, arrêter temporairement pour le seek
        if (this.isPlaying) {
            this.stopStreaming();
            
            // Réinitialiser le tracking pour la nouvelle position  
            this.playStartTime = Date.now();
            this.playStartPosition = time;
            
            // Redémarrer immédiatement à la nouvelle position
            this.startStreaming();
        } else {
            this.generateStaticFrame();
        }
        
        // ULTRA-LOW LATENCY: Broadcast seek avec l'état actuel (pas de changement)
        this.broadcast({
            type: 'seek',
            position: time,
            playing: this.isPlaying  // Garder l'état actuel
        });
    }
    
    startStreaming() {
        if (!this.currentVideo || !fs.existsSync(this.currentVideo)) {
            console.log('Video file not found for streaming');
            return;
        }
        
        this.stopStreaming(); // Ensure clean state
        
        
        const { spawn } = require('child_process');
        
        const ffmpegArgs = [
            '-re', // Read input at native frame rate
            '-ss', this.currentPosition.toString(),
            '-i', this.currentVideo,
            '-f', 'image2pipe',
            '-vcodec', 'mjpeg',
            '-q:v', '8',
            '-s', '640x360',
            '-an',
            'pipe:1'
        ];
        
        
        try {
            this.ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
            
            let frameBuffer = Buffer.alloc(0);
            const frameStart = Buffer.from([0xFF, 0xD8]); // JPEG start
            const frameEnd = Buffer.from([0xFF, 0xD9]);   // JPEG end
            
            this.ffmpegProcess.stdout.on('data', (chunk) => {
                frameBuffer = Buffer.concat([frameBuffer, chunk]);
                
                let startIndex = 0;
                let endIndex;
                
                while ((endIndex = frameBuffer.indexOf(frameEnd, startIndex)) !== -1) {
                    const frameData = frameBuffer.slice(startIndex, endIndex + 2);
                    
                    this.broadcast({
                        type: 'frame',
                        data: frameData.toString('base64'),
                        timestamp: Date.now()
                    });
                    
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
        // Check if video is already loaded and is the same file
        if (this.currentVideo === videoPath) {
            console.log(`ENDPOINT: /set-video → "${videoPath}" (already loaded, ignoring)`);
            res.status(200).json({ok: true, status: 'already_loaded'});
            return;
        }
        
        // Load video only if different or no video loaded
        console.log(`ENDPOINT: /set-video → "${videoPath}" (loading new video)`);
        this.setVideo(videoPath);
        res.status(200).json({ok: true, status: 'loaded'});
    }
    
    processPendingSetVideoRequests() {
        console.log(`📋 Processing ${this.pendingSetVideoRequests.length} pending /set-video requests`);
        
        while (this.pendingSetVideoRequests.length > 0) {
            const request = this.pendingSetVideoRequests.shift();
            this.handleSetVideoRequest(request.videoPath, request.res);
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
            '-ss', this.currentPosition.toString(),
            '-i', this.currentVideo,
            '-vframes', '1', // Une seule frame
            '-f', 'image2pipe',
            '-vcodec', 'mjpeg',
            '-q:v', '8',
            '-s', '640x360',
            'pipe:1'
        ];
        
        try {
            this.staticFrameProcess = spawn(ffmpegPath, ffmpegArgs);
            
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
            
            const ffprobe = spawn(ffprobePath, [
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