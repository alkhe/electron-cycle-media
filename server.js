import { app, BrowserWindow, globalShortcut as Shortcut } from 'electron';

let win = null;

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('ready', () => {
	win = new BrowserWindow({ width: 480, height: 360 });
	win.setMenu(null);
	win.loadURL('file://' + __dirname + '/src/index.html');
	// win.webContents.openDevTools();

	win.on('closed', () => {
		win = null;
	});

	Shortcut.register('Control+Q', () => {
		win.close();
	});

	Shortcut.register('F12', () => {
		win.toggleDevTools({ detach: true });
	});
});
