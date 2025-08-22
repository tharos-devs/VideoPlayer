// /Applications/MuseScore\ 4.app/Contents/MacOS/mscore -d
import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import Muse.UiComponents 1.0
import MuseScore.Playback 1.0
import MuseScore 3.0

MuseScore {
  id: plugin
  title: "Video Player"
  description: "Video Player"
  thumbnailName: "logo.png"
  version: "1.0.0"
  // pluginType: "dialog"

  width: 400
  height: 160

  property int pluginInstanceId: Number(Math.floor(Math.random() * 10000))
  property var videoSource: ""
  property var playbackModel: null
  property bool showError: false
  property bool showMain: false

  // Palette système pour s'adapter au thème
  SystemPalette {
    id: palette
  }

  QProcess {
    id: qproc
    onReadyReadStandardOutput: {
      var output = readAllStandardOutput().toString()
      console.log("INSTANCE", pluginInstanceId, "VideoPlayer stdout:", output)
      
      if (output.indexOf("WEBRTC_SERVER_READY") !== -1) {
        console.log("INSTANCE", pluginInstanceId, "WebRTC server is ready!")
        videoSource = curScore.metaTag("videoSource")
        if (videoSource && videoSource !== "") {
          showMain = true
        } else {
          fileDialog.visible = true
        }
      }
    }
    onReadyReadStandardError: {
      var error = readAllStandardError().toString()
      console.log("INSTANCE", pluginInstanceId, "VideoPlayer stderr:", error)
    }
  }

  PlaybackToolBarModel {
    id: directPlaybackModel
    Component.onCompleted: {
      this.load()
      plugin.playbackModel = this
    }
  }

  FileDialog {
    id: fileDialog
    title: "Please choose a file"
    type: FileDialog.Load
    visible: false
    onAccepted: {
      console.log("INSTANCE", pluginInstanceId, "Selected file:", filePath)
      curScore.startCmd()
      curScore.setMetaTag("videoSource", filePath)
      curScore.endCmd()
      fileDialog.visible = false
      sendCommand('set-video', filePath)
      player.start()
      quit()
    }
    onRejected: {
      fileDialog.visible = false
      quit()
    }
  }

  // Shield to avoid multiple plugin instance
  Timer {
    id: shield
    interval: 100
    running: true
    repeat: true
    onTriggered: {
      const videoPlayerId = Number(curScore.metaTag("videoPlayerId"))
      if (videoPlayerId && videoPlayerId !== pluginInstanceId) {
        console.log("INSTANCE", pluginInstanceId, "plugin terminated")
        player.stop()
        quit()
      }
    }
  }


  Timer {
    id: player
    interval: 100
    running: false
    repeat: true

    property bool lastPlayingState: false
    property string lastPosition: "00:00:00.00"

    onTriggered: {
      if (!playbackModel || !playbackModel.items || playbackModel.items.length < 2)
        return;

      // Obtenir la position actuelle
      var currentPosition = "00:00:00.00";
      var timingInSeconds = 0.0;

      if (playbackModel.playTime) {
        var time = playbackModel.playTime;
        currentPosition = time.getHours().toString().padStart(2, '0') + ":" + time.getMinutes().toString().padStart(2, '0') + ":" + time.getSeconds().toString().padStart(2, '0') + "." + Math.floor(time.getMilliseconds() / 10).toString().padStart(2, '0');

        // Convertir en secondes.millisecondes pour sendCommand
        timingInSeconds = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds() + (time.getMilliseconds() / 1000);
      }

      // Détecter l'état actuel
      var playButton = playbackModel.items[1];
      var isPlaying = (playButton.icon === 62409);

      // Détecter les changements d'état (play/pause/rewind)
      var stateChanged = (lastPlayingState !== isPlaying);
      var positionJumped = (Math.abs(parsePosition(currentPosition) - parsePosition(lastPosition)) > 1);

      if (stateChanged || positionJumped) {
        var action = "";
        if (stateChanged) {
            action = isPlaying ? "play" : "pause";
        } else if (positionJumped) {
            action = "seek";
        }

        console.log(action + " - Position:", currentPosition, "- Timing:", timingInSeconds);

        // Envoyer la position en secondes.millisecondes
        sendCommand(action, timingInSeconds);
      }

      lastPlayingState = isPlaying;
      lastPosition = currentPosition;
    }

    function parsePosition(timeStr) {
      var parts = timeStr.split(":");
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    }
  }

  // Vue d'erreur
  Rectangle {
    id: errorView
    visible: showError
    anchors.fill: parent
    color: palette.window

    ColumnLayout {
      anchors.centerIn: parent
      spacing: 10

      Text {
        text: "Video Player"
        font.pixelSize: 16
        font.bold: true
        Layout.alignment: Qt.AlignHCenter
        color: palette.windowText
    }

      Text {
        text: "Only for Musescore 4+"
        font.pixelSize: 14
        Layout.alignment: Qt.AlignHCenter
        color: palette.windowText
      }

      FlatButton {
        text: "OK"
        Layout.alignment: Qt.AlignHCenter
        Layout.preferredWidth: 100
        accentButton: true
        onClicked: {
          quit()
        }
      }
    }
  }

  // Vue principale
  Rectangle {
    id: mainView
    visible: showMain
    anchors.fill: parent
    color: palette.window

    ColumnLayout {
      anchors.fill: parent
      anchors.margins: 20
      spacing: 10

      // Question principale
      Text {
        text: "Load file or select new video?"
        font.pixelSize: 14
        Layout.fillWidth: true
        wrapMode: Text.WordWrap
        color: palette.windowText
      }

      // Texte d'information sur le fichier
      Text {
        text: "Video file: " + videoSource
        font.pixelSize: 12
        Layout.fillWidth: true
        wrapMode: Text.WordWrap
        color: palette.windowText
      }

      // Espacement flexible
      Item {
        Layout.fillHeight: true
      }

      // Boutons d'action
      RowLayout {
        Layout.fillWidth: true
        Layout.alignment: Qt.AlignHCenter
        spacing: 10

        FlatButton {
          id: loadButton
          text: "Load"
          accentButton: true
          focus: true
          Layout.preferredWidth: 100

          onClicked: {
            sendCommand('set-video', videoSource)
            player.start()
            quit()
          }
        }

        FlatButton {
          id: selectButton
          text: "Select"
          Layout.preferredWidth: 100

          onClicked: {
            fileDialog.visible = true
            quit()
          }
        }

        FlatButton {
          id: cancelButton
          text: "Cancel"
          Layout.preferredWidth: 100

          onClicked: {
            quit()
          }
        }
      }
    }
  }

  function sendCommand(command, params) {
    if (!params) params = ''
    
    var url = "http://localhost:5173"
    switch (command) {
      case 'set-video':
        console.log("INSTANCE", pluginInstanceId, "Raw params:", JSON.stringify(params))
        console.log("INSTANCE", pluginInstanceId, "Encoded params:", encodeURIComponent(params))
        url = url + "/set-video?path=" + encodeURIComponent(params)
        break
      case 'pause':
        url = url + "/" + command
        break
      default:
        url = url + "/" + command + "/" + params
        break
    }

    var xhr = new XMLHttpRequest()
    xhr.open("GET", url, true)
    xhr.send()
    console.log("INSTANCE", pluginInstanceId, command, "Final URL:", url)
  }

  function getVideoPlayer() {
    const path = Qt.resolvedUrl(".");
    var videoPlayer = ""
    switch (Qt.platform.os) {
      case "windows":
        videoPlayer = normalizePath(path + "VideoPlayer.exe");
        break
      case "osx":
        videoPlayer = normalizePath(path + "VideoPlayer.app/Contents/MacOS/VideoPlayer")
        break
      case "linux":
        videoPlayer = normalizePath(path + "VideoPlayer")
        break  
      default:
        console.log('No video player found for this platform', Qt.platform.os)          
    }
    console.log(videoPlayer)
    return videoPlayer
  }

  function normalizePath(path) {
    var p = path.toString()
    // Supprime "file:///" ou "file://" (et conserve le premier / pour Unix)
    var normalizedPath
    if (p.startsWith('file:///')) {
      // Système UNIX (Linux/macOS), on garde le premier '/'
      normalizedPath = p.replace(/^file:\/{3}/, '/')
    } else if (p.startsWith('file://')) {
      // Cas possible pour Windows, pas de premier '/' après 'file://'
      normalizedPath = p.replace(/^file:\/{2}/, '')
    } else {
      normalizedPath = p
    }
    return normalizedPath
  }     

  Component.onCompleted: {
    if (mscoreMajorVersion < 4) {
      showError = true
    }
  }

  onRun: {
    if (!curScore) {
      console.log("No score opened")
      quit()
      return
    }

    console.log("INSTANCE", pluginInstanceId, "plugin started")
    curScore.startCmd()
    curScore.setMetaTag("videoPlayerId", pluginInstanceId)
    curScore.endCmd()

    const videoPlayer = getVideoPlayer()
    qproc.startWithArgs(videoPlayer, [])
    
    // La synchronisation se fait via onReadyReadStandardOutput du QProcess
  }
}
