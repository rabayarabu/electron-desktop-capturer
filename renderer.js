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