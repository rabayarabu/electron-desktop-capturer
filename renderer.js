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
	audio: false,
};

navigator.mediaDevices.getDisplayMedia = getDisplayMedia;
// start recording
if (navigator.mediaDevices) {
	console.log("getUserMedia supported.");
  
	const constraints = { audio: true };
	let chunks = [];
  
	navigator.mediaDevices
	  .getUserMedia(constraints)
	  .then((stream) => {
		const mediaRecorder = new MediaRecorder(stream);
  
		startBtn.onclick = () => {
		  mediaRecorder.start();
		  console.log(mediaRecorder.state);
		  console.log("recorder started");
		  startBtn.style.background = "red";
		  startBtn.style.color = "black";
		};
  
		stop.onclick = () => {
		  mediaRecorder.stop();
		  console.log(mediaRecorder.state);
		  console.log("recorder stopped");
		  startBtn.style.background = "";
		  startBtn.style.color = "";
		};
  
		mediaRecorder.onstop = (e) => {
		  console.log("data available after MediaRecorder.stop() called.");
  
		  const clipName = prompt("Enter a name for your sound clip");
  
		  const clipContainer = document.createElement("article");
		  const clipLabel = document.createElement("p");
		  const audio = document.createElement("audio");
		  const deleteButton = document.createElement("button");
		  const mainContainer = document.querySelector("body");
  
		  clipContainer.classList.add("clip");
		  audio.setAttribute("controls", "");
		  deleteButton.textContent = "Delete";
		  clipLabel.textContent = clipName;
  
		  clipContainer.appendChild(audio);
		  clipContainer.appendChild(clipLabel);
		  clipContainer.appendChild(deleteButton);
		  mainContainer.appendChild(clipContainer);
  
		  audio.controls = true;
		  const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
		  chunks = [];
		  const audioURL = URL.createObjectURL(blob);
		  audio.src = audioURL;
		  console.log("recorder stopped");
  
		  deleteButton.onclick = (e) => {
			const evtTgt = e.target;
			evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
		  };
		};
  
		mediaRecorder.ondataavailable = (e) => {
		  chunks.push(e.data);
		};
	  })
	  .catch((err) => {
		console.error(`The following error occurred: ${err}`);
	  });
  }
  
// Set event listeners for the start, stop and openSettings buttons
startBtn.addEventListener("click", startCapture, false);
stopBtn.addEventListener("click", stopCapture, false);
openSettingsBtn.addEventListener("click", openPreferences, false);

async function startCapture() {
	try {
		video.srcObject = await navigator.mediaDevices.getDisplayMedia(
			displayMediaOptions
		);
		startBtn.classList = 'hidden';
		stopBtn.classList = '';
	} catch (err) {
		console.error(err);
	}
}

function stopCapture(evt) {
	if (!video.srcObject) return;
	
	let tracks = video.srcObject.getTracks();

	tracks.forEach((track) => track.stop());
	video.srcObject = null;
	startBtn.classList = '';
	stopBtn.classList = '';
}

function openPreferences() {
	main.openScreenSecurity();
}

let screenPickerOptions = {
	system_preferences: false
};

function getDisplayMedia() {
	if (main.isOSX()) {
		screenPickerOptions.system_preferences = true;
	}

	return new Promise(async (resolve, reject) => {
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
						audio: false,
						video: {
							mandatory: {
								chromeMediaSource: 'desktop',
								chromeMediaSourceId: source.id
							}
						}
					});
					resolve(stream);
				}
				catch (err) {
					reject(err);
				}
			}, {});
		}
		catch (err) {
			reject(err);
		}
	});
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