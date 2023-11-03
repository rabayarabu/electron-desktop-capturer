// We have created three channels* that are responsible for sending messages to the Main process:

// electronMain:openScreenSecurity
// electronMain:getScreenAccess
// electronMain:screen:getSources

// *The names of the channels can be customized as per your preference.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('Electron', {
	main: {
		isOSX: () => process.platform === 'darwin',
		isWindows: () => process.platform === 'win32',
		isLinux: () => /linux/.test(process.platform),
		openScreenSecurity: () => ipcRenderer.invoke('electronMain:openScreenSecurity'),
		getScreenAccess: () => ipcRenderer.invoke('electronMain:getScreenAccess'),
		getScreenSources: () => ipcRenderer.invoke('electronMain:screen:getSources'),
	}
});