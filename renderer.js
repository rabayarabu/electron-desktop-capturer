/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
// The main magic happens in the getDisplayMedia() function. We request
//  the Main process for ScreenAccess permission, then we request ScreenSources 
// and display our modal Screen Picker with the available sources.

const main = window.Electron.main;

const video = document.querySelector('#stream');
const startBtn = document.querySelector('#start');
const stopBtn = document.querySelector('#stop');
const openSettingsBtn = document.querySelector('#system-preferences');
const screenPicker = document.querySelector('#electron-screen-picker');

const displayMediaOptions = {
	video: {
		displaySurface: "window",
	},
	audio: true,
};

var screenPickerOptions = {
	system_preferences: false
};
var mediaRecorder = null;
var recordedCunks = [];

// navigator.mediaDevices.getDisplayMedia = getDisplayMedia;
// start recording


// Set event listeners for the start, stop and openSettings buttons
startBtn.addEventListener("click", startCapture, false);
stopBtn.addEventListener("click", stopCapture, false);
openSettingsBtn.addEventListener("click", openPreferences, false);

async function startCapture() {
	try {
		startBtn.classList = 'hidden';
		stopBtn.classList = '';
		getDisplayMedia();
	} catch (err) {
		console.error(err);
	}
}

function stopCapture(evt) {
	startBtn.classList = '';
	stopBtn.classList = '';
	if (mediaRecorder !== null) {
		mediaRecorder.stop();
	}
}

function openPreferences() {
	main.openScreenSecurity();
}

async function getDisplayMedia() {
	if (main.isOSX()) {
		screenPickerOptions.system_preferences = true;
	}

	let has_access = await main.getScreenAccess();
	if (!has_access) {
		return reject('none');
	}

	try {
		const sources = await main.getScreenSources();
		screenPickerShow(sources, async (id) => {
			try {
				const source = sources.find(source => source.id === id);
				if (!source) {
					return reject('none');
				}

				const stream = await window.navigator.mediaDevices.getUserMedia({
					audio: true,
					video: {
						mandatory: {
							chromeMediaSource: 'desktop',
							chromeMediaSourceId: source.id
						}
					}
				});

				if (stream) {
					console.log("getUserMedia supported.", stream);
					mediaRecorder = new MediaRecorder(stream);
					mediaRecorder.onstart = () => {
						console.log("recorder started");
						startBtn.style.background = "red";
						startBtn.style.color = "black";
					}
					mediaRecorder.ondataavailable = (e) => {
						const { data } = e;
						if (data.size > 0) {
							recordedCunks.push(e.data);
						}
					};
					mediaRecorder.onstop = (e) => {
						if (recordedCunks.length > 0) {
							const videoUrl = URL.createObjectURL(new Blob(recordedCunks, { type: 'video/mp4' }));
							downloadFile(videoUrl, 'recording');
						}

						console.log("data available after MediaRecorder.stop() called.");

					};
					mediaRecorder.start();
				}
			}
			catch (err) {
				reject(err);
			}
		}, {});
	}
	catch (err) {
		reject(err);
	}
}

function downloadFile(uri, name) {
	let link = document.createElement('a');
	link.download = name;
	link.href = uri;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function screenPickerShow(sources, onselect) {
	const list = document.querySelector('#sources');
	list.innerHTML = '';

	sources.forEach(source => {
		const item = document.createElement('div');
		item.classList = '__electron-list';

		const wrapper = document.createElement('div');
		wrapper.classList = 'thumbnail __electron-screen-thumbnail';

		const thumbnail = document.createElement('img');
		thumbnail.src = source.thumbnailURL;

		const label = document.createElement('div');
		label.classList = '__electron-screen-name';
		label.innerText = source.name;

		wrapper.append(thumbnail);
		wrapper.append(label);
		item.append(wrapper);
		item.onclick = () => {
			onselect(source.id);
			MicroModal.close('electron-screen-picker');
		};
		list.append(item);
	});

	if (!screenPickerOptions.system_preferences) {
		openSettingsBtn.classList = 'hidden';
	}

	MicroModal.show('electron-screen-picker');
}


/* ---------------------------- UI functions ---------------------------------------------- */

