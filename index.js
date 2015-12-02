const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Shortcut = electron.globalShortcut;

var win = null;

app.on('window-all-closed', function() {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('ready', function() {
	win = new BrowserWindow({ width: 480, height: 360 });
	win.setMenu(null);
	win.loadURL('file://' + __dirname + '/src/index.html');
	// win.webContents.openDevTools();

	win.on('closed', function() {
		win = null;
	});

	Shortcut.register('Control+Q', () => {
		win.close();
	});

	Shortcut.register('F12', () => {
		win.toggleDevTools({ detach: true });
	});
});
