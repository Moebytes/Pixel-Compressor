import fs from "fs"

fs.copyFileSync("./patch/mozjpeg.js", "./node_modules/mozjpeg/lib/index.js")
fs.copyFileSync("./patch/pngquant-bin.js", "./node_modules/pngquant-bin/lib/index.js")
fs.copyFileSync("./patch/cwebp-bin.js", "./node_modules/cwebp-bin/lib/index.js")
fs.copyFileSync("./patch/gifsicle.js", "./node_modules/gifsicle/lib/index.js")