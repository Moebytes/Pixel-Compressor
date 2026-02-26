'use strict';
const path = require('path');
const BinWrapper = require('bin-wrapper');
const pkg = require('../package.json');

const url = `https://raw.githubusercontent.com/imagemin/mozjpeg-bin/v${pkg.version}/vendor/`;

let destPath = path.join(__dirname, '../vendor');

if (destPath.includes('.asar')) {
	destPath = destPath.replace('app.asar', 'app.asar.unpacked');
}

module.exports = new BinWrapper()
	.src(`${url}macos/cjpeg`, 'darwin')
	.src(`${url}linux/cjpeg`, 'linux')
	.src(`${url}win/cjpeg.exe`, 'win32')
	.dest(destPath)
	.use(process.platform === 'win32' ? 'cjpeg.exe' : 'cjpeg');
