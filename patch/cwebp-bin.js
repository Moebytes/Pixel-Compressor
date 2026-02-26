'use strict';
const path = require('path');
const BinWrapper = require('bin-wrapper');
const pkg = require('../package.json');

const url = `https://raw.githubusercontent.com/imagemin/cwebp-bin/v${pkg.version}/vendor/`;

let destPath = path.join(__dirname, '../vendor');

if (destPath.includes('.asar')) {
    destPath = destPath.replace('app.asar', 'app.asar.unpacked');
}

module.exports = new BinWrapper()
	.src(`${url}osx/cwebp`, 'darwin')
	.src(`${url}linux/x86/cwebp`, 'linux', 'x86')
	.src(`${url}linux/x64/cwebp`, 'linux', 'x64')
	.src(`${url}win/x86/cwebp.exe`, 'win32', 'x86')
	.src(`${url}win/x64/cwebp.exe`, 'win32', 'x64')
	.dest(destPath)
	.use(process.platform === 'win32' ? 'cwebp.exe' : 'cwebp');
