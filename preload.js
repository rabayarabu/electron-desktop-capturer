// const { ipcRenderer } = require('electron');

// // Trigger the desktop stream capture
// ipcRenderer.send('get-desktop-stream', 'Entire screen');

// ipcRenderer.on('desktop-stream', (event, stream) => {
//     // Do something with the stream, for example, display it in a <video> element
//     handleStream(stream);
// });

// function handleStream(stream) {
//     const video = document.createElement('video')
//     video.srcObject = stream
//     video.onloadedmetadata = (e) => video.play()
//     document.appendChild(video)
// }

// function handleError(e) {
//     console.log(e)
// }
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronApi', {
	main: {
		isOSX: () => process.platform === 'darwin',
		isWindows: () => process.platform === 'win32',
		isLinux: () => /linux/.test(process.platform),
		openScreenSecurity: () => ipcRenderer.invoke('electronMain:openScreenSecurity'),
		getScreenAccess: () => ipcRenderer.invoke('electronMain:getScreenAccess'),
		getScreenSources: () => ipcRenderer.invoke('electronMain:screen:getSources'),
	}
});