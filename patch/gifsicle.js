'use strict';
const path = require('path');
const BinWrapper = require('bin-wrapper');
const pkg = require('../package.json');

const url = `https://raw.githubusercontent.com/imagemin/gifsicle-bin/v${pkg.version}/vendor/`;

let destPath = path.join(__dirname, '../vendor');

if (destPath.includes('.asar')) {
    destPath = destPath.replace('app.asar', 'app.asar.unpacked');
}

module.exports = new BinWrapper()
	.src(`${url}macos/gifsicle`, 'darwin')
	.src(`${url}linux/x86/gifsicle`, 'linux', 'x86')
	.src(`${url}linux/x64/gifsicle`, 'linux', 'x64')
	.src(`${url}freebsd/x86/gifsicle`, 'freebsd', 'x86')
	.src(`${url}freebsd/x64/gifsicle`, 'freebsd', 'x64')
	.src(`${url}win/x86/gifsicle.exe`, 'win32', 'x86')
	.src(`${url}win/x64/gifsicle.exe`, 'win32', 'x64')
	.dest(destPath)
	.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');
