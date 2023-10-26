const { ipcRenderer } = require('electron');

// Trigger the desktop stream capture
ipcRenderer.send('get-desktop-stream', 'Entire screen');

ipcRenderer.on('desktop-stream', (event, stream) => {
    // Do something with the stream, for example, display it in a <video> element
    handleStream(stream);
});

function handleStream(stream) {
    const video = document.createElement('video')
    video.srcObject = stream
    video.onloadedmetadata = (e) => video.play()
    document.appendChild(video)
}

function handleError(e) {
    console.log(e)
}