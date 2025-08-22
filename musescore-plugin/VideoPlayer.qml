import QtQuick 2.9
import QtQuick.Controls 2.2
import QtQuick.Dialogs 1.2
import MuseScore 3.0

MuseScore {
    id: plugin
    version: "1.0.0"
    description: "VideoPlayer - Sync video playback with MuseScore"
    menuPath: "Plugins.VideoPlayer"
    requiresScore: false

    property string videoPath: ""
    property bool videoPlayerRunning: false

    // File dialog for video selection
    FileDialog {
        id: fileDialog
        title: "Select Video File"
        nameFilters: ["Video files (*.mp4 *.avi *.mov *.mkv *.webm)", "All files (*)"]
        onAccepted: {
            videoPath = fileDialog.fileUrl.toString().replace("file://", "")
            console.log("Selected video:", videoPath)
            startVideoPlayer()
            setVideoPath()
        }
    }

    // Main plugin window
    Rectangle {
        id: window
        width: 400
        height: 300
        color: "#f0f0f0"
        
        Column {
            anchors.centerIn: parent
            spacing: 20
            
            Text {
                text: "VideoPlayer for MuseScore"
                font.pointSize: 16
                font.bold: true
                anchors.horizontalCenter: parent.horizontalCenter
            }
            
            Text {
                text: videoPath ? "Video: " + videoPath.split('/').pop() : "No video selected"
                anchors.horizontalCenter: parent.horizontalCenter
                color: videoPath ? "green" : "red"
            }
            
            Row {
                spacing: 10
                anchors.horizontalCenter: parent.horizontalCenter
                
                Button {
                    text: "Select Video"
                    onClicked: fileDialog.open()
                }
                
                Button {
                    text: "Test Play"
                    enabled: videoPath !== ""
                    onClicked: sendPlayCommand()
                }
                
                Button {
                    text: "Test Pause"
                    enabled: videoPath !== ""
                    onClicked: sendPauseCommand()
                }
            }
            
            Text {
                text: "Use MuseScore spacebar to play/pause video"
                anchors.horizontalCenter: parent.horizontalCenter
                font.italic: true
                color: "gray"
            }
            
            Text {
                text: videoPlayerRunning ? "✅ VideoPlayer connected" : "❌ VideoPlayer not running"
                anchors.horizontalCenter: parent.horizontalCenter
                color: videoPlayerRunning ? "green" : "red"
            }
        }
    }

    // Start VideoPlayer executable
    function startVideoPlayer() {
        console.log("Starting VideoPlayer...")
        
        // Determine executable path based on platform
        var executablePath = ""
        var pluginDir = Qt.resolvedUrl(".").toString().replace("file://", "")
        
        if (Qt.platform.os === "windows") {
            executablePath = pluginDir + "VideoPlayer.exe"
        } else if (Qt.platform.os === "osx") {
            executablePath = pluginDir + "VideoPlayer.app/Contents/MacOS/VideoPlayer"
        } else if (Qt.platform.os === "linux") {
            executablePath = pluginDir + "VideoPlayer"
        }
        
        console.log("Executable path:", executablePath)
        
        // Start the VideoPlayer process
        var process = Qt.createQmlObject('
            import QtQuick 2.9
            import Qt.labs.platform 1.0
            Process {
                id: videoPlayerProcess
                program: "' + executablePath + '"
                onFinished: {
                    console.log("VideoPlayer process finished")
                    videoPlayerRunning = false
                }
            }
        ', plugin)
        
        try {
            process.start()
            videoPlayerRunning = true
            console.log("VideoPlayer started successfully")
            
            // Wait a moment for the server to start
            delayTimer.start()
        } catch (error) {
            console.error("Failed to start VideoPlayer:", error)
            videoPlayerRunning = false
        }
    }

    // Send video path to VideoPlayer
    function setVideoPath() {
        if (!videoPath) return
        
        var xhr = new XMLHttpRequest()
        xhr.open("GET", "http://localhost:5173/set-video?path=" + encodeURIComponent(videoPath))
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    console.log("Video path set successfully")
                } else {
                    console.error("Failed to set video path:", xhr.status)
                }
            }
        }
        xhr.send()
    }

    // Send play command
    function sendPlayCommand() {
        sendCommand("play")
    }

    // Send pause command  
    function sendPauseCommand() {
        sendCommand("pause")
    }

    // Send command to VideoPlayer
    function sendCommand(command) {
        var xhr = new XMLHttpRequest()
        xhr.open("GET", "http://localhost:5173/" + command)
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    console.log("Command sent:", command)
                } else {
                    console.error("Failed to send command:", command, xhr.status)
                }
            }
        }
        xhr.send()
    }

    // Timer for delayed operations
    Timer {
        id: delayTimer
        interval: 2000 // 2 seconds
        onTriggered: {
            if (videoPath) {
                setVideoPath()
            }
        }
    }

    // Override MuseScore spacebar behavior
    property bool spacebarOverride: false
    
    function interceptSpacebar() {
        if (videoPath && videoPlayerRunning) {
            // Toggle play/pause when spacebar is pressed
            if (curScore.playMode === Score.PLAYING) {
                sendPauseCommand()
            } else {
                sendPlayCommand()
            }
        }
    }

    onRun: {
        // Show the plugin window
        window.visible = true
        console.log("VideoPlayer plugin loaded")
    }
}