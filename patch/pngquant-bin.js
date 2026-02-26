'use strict';
const path = require('path');
const BinWrapper = require('bin-wrapper');
const pkg = require('../package.json');

const url = `https://raw.githubusercontent.com/imagemin/pngquant-bin/v${pkg.version}/vendor/`;

let destPath = path.join(__dirname, '../vendor');

if (destPath.includes('.asar')) {
    destPath = destPath.replace('app.asar', 'app.asar.unpacked');
}

module.exports = new BinWrapper()
	.src(`${url}macos/pngquant`, 'darwin')
	.src(`${url}linux/x86/pngquant`, 'linux', 'x86')
	.src(`${url}linux/x64/pngquant`, 'linux', 'x64')
	.src(`${url}freebsd/x64/pngquant`, 'freebsd', 'x64')
	.src(`${url}win/pngquant.exe`, 'win32')
	.dest(destPath)
	.use(process.platform === 'win32' ? 'pngquant.exe' : 'pngquant');
