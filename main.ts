import {app, BrowserWindow, Menu, MenuItemConstructorOptions, dialog, ipcMain, shell} from "electron"
import localShortcut from "electron-localshortcut"
import Store from "electron-store"
import dragAddon from "electron-click-drag-plugin"
import fs from "fs"
import imageSize from "image-size"
import path from "path"
import process from "process"
import functions from "./structures/functions"
import mainFunctions from "./structures/mainFunctions"
import imagemin from "imagemin"
import imageminMozjpeg from "imagemin-mozjpeg"
import imageminGifsicle from "imagemin-gifsicle"
import imageminWebp from "imagemin-webp"
import imageminPngquant from "imagemin-pngquant"
import imagesMeta from "images-meta"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"
import sharp from "sharp"
// @ts-ignore
import Helvetica from "pdfkit/js/data/Helvetica.afm"
import PDFDocument from "@react-pdf/pdfkit"
import mkvExtractor from "mkv-subtitle-extractor"
import srt2vtt from "srt-to-vtt"
import {ID3Writer} from "browser-id3-writer"
import dumpPDFImages from "./pdf-images"
import pack from "./package.json"

process.setMaxListeners(0)
let window: Electron.BrowserWindow | null
let preview: Electron.BrowserWindow | null
const store = new Store()
let initialTransparent = process.platform === "win32" ? store.get("transparent", false) as boolean : true

const history: Array<{id: number, source: string, dest?: string}> = []
const active: Array<{id: number, source: string, dest: string, action: null | "stop"}> = []
const queue: Array<{started: boolean, info: any}> = []

ipcMain.handle("close", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
})

ipcMain.handle("minimize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
})

ipcMain.handle("maximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
})

ipcMain.on("moveWindow", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const handle = win?.getNativeWindowHandle()
  if (!handle) return
  const windowID = process.platform === "linux" ? handle.readUInt32LE(0) : handle
  dragAddon.startDrag(windowID)
})

ipcMain.handle("shell:openPath", (event, location: string) => {
  shell.openPath(path.normalize(location))
})

ipcMain.handle("shell:showItemInFolder", (event, location: string) => {
  shell.showItemInFolder(path.normalize(location))
})

ipcMain.handle("song-cover", async (event, files: string[]) => {
  const MP3s = files.filter((f) => path.extname(f) === ".mp3")
  const images = files.filter((f) => path.extname(f).toLowerCase() === ".jpg" 
  || path.extname(f).toLowerCase() === ".jpeg"
  || path.extname(f).toLowerCase() === ".png" 
  || path.extname(f).toLowerCase() === ".webp"
  || path.extname(f).toLowerCase() === ".avif")

  for (let i = 0; i < MP3s.length; i++) {
    if (!images[i]) break
    const songBuffer = fs.readFileSync(MP3s[i])
    const imageBuffer = fs.readFileSync(images[i])

    const writer = new ID3Writer(songBuffer.buffer)
    .setFrame("APIC" as any, {type: 3, data: imageBuffer, description: "Song Cover", useUnicodeEncoding: false} as any)
    writer.addTag()

    const arrayBuffer = await writer.getBlob().arrayBuffer()
    fs.writeFileSync(MP3s[i], Buffer.from(arrayBuffer))
  }

  shell.showItemInFolder(MP3s[0])
})

const removeDoubles = async (images: string[], dontProcessAll?: boolean) => {
  images = images.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)

  let doubleImages: string[] = []
  let widthMap = {} as any 

  for (let i = 0; i < images.length; i++) {
    const metadata = await sharp(images[i], {limitInputPixels: false}).metadata()
    const width = metadata.width || 0
    if (widthMap[width]) {
      widthMap[width] += 1
    } else {
      widthMap[width] = 1
    }
  }

  let commonWidth = 0
  let freq = 0
  for (let i = 0; i < Object.keys(widthMap).length; i++) {
    const key = Object.keys(widthMap)[i]
    const value = Object.values(widthMap)[i]
    if (freq < Number(value)) {
      freq = Number(value) 
      commonWidth = Number(key)
    }
  }

  for (let i = 0; i < images.length; i++) {
    const metadata = await sharp(images[i], {limitInputPixels: false}).metadata()
    const width = metadata.width || 0
    if (width > commonWidth * 1.5) {
      doubleImages.push(images[i])
    }
  }

  // If all images have the same width, treat all of them as doubles 
  if (!doubleImages.length) {
    if (!dontProcessAll) doubleImages = images
  }

  for (let i = 0; i < doubleImages.length; i++) {
    const metadata = await sharp(doubleImages[i], {limitInputPixels: false}).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0
    const newWidth = Math.floor(width / 2)
    const page1 = `${path.dirname(doubleImages[i])}/${path.basename(doubleImages[i], path.extname(doubleImages[i]))}.1${path.extname(doubleImages[i])}`
    const page2 = `${path.dirname(doubleImages[i])}/${path.basename(doubleImages[i], path.extname(doubleImages[i]))}.2${path.extname(doubleImages[i])}`
    await sharp(doubleImages[i], {limitInputPixels: false})
        .extract({left: newWidth, top: 0, width: newWidth, height: height})
        .toFile(page1)
    await sharp(doubleImages[i], {limitInputPixels: false})
        .extract({left: 0, top: 0, width: newWidth, height: height})
        .toFile(page2)
  }

  const promiseArray: any[] = []
  for (let i = 0; i < doubleImages.length; i++) {
    promiseArray.push(new Promise<void>((resolve) => {
      fs.unlink(doubleImages[i], () => resolve())
    }))
  }
  await Promise.all(promiseArray)
}

ipcMain.handle("remove-duplicate-subs", async (event, files: string[]) => {
  for (let i = 0; i < files.length; i++) {
    const content = fs.readFileSync(files[i]).toString().split("\n")
    let obj = {} as any 

    for (let j = 0; j < content.length; j++) {
      if (!Number.isNaN(Number(content[j][0]))) {
        if (obj[content[j]]) continue 
        obj[content[j]] = content[j+1]
      }
    }

    let newContent = "WEBVTT\n\n"

    for (let j = 0; j < Object.keys(obj).length; j++) {
      const key = Object.keys(obj)[j]
      const value = Object.values(obj)[j]
      newContent += `${key}\n${value}\n\n`
    }
    
    fs.writeFileSync(files[i], newContent)
  }
  shell.openPath(path.dirname(files[0]))
})

const subToVtt = async (subtitles: string[]): Promise<any> => {
  const srtSubs = [] as string[]
  for (let i = 0; i < subtitles.length; i++) {
    await new Promise<void>((resolve, reject) => {

      if (path.extname(subtitles[i]) === ".ass") {
        const vtt = functions.ass2vtt(fs.readFileSync(subtitles[i]).toString())
        const vttDest = `${path.dirname(subtitles[i])}/${path.basename(subtitles[i], path.extname(subtitles[i]))}.vtt`
        fs.writeFileSync(vttDest, vtt)
        return resolve()
      }

      const readStream =  fs.createReadStream(subtitles[i])
      if (path.extname(subtitles[i]) === ".srt") readStream.pipe(srt2vtt())
      const writeStream = fs.createWriteStream(`${path.dirname(subtitles[i])}/${path.basename(subtitles[i], path.extname(subtitles[i]))}.vtt`)
      readStream.pipe(writeStream)
          .on("error", (e) => console.log(e))
          .on("end", () => resolve())
          .on("finish", () => resolve())
    })
  }

  const promiseArray: any[] = []
  for (let i = 0; i < subtitles.length; i++) {
    promiseArray.push(new Promise<void>((resolve) => {
      fs.unlink(subtitles[i], () => resolve())
    }))
  }
  await Promise.all(promiseArray)

  if (srtSubs.length) {
    return subToVtt(srtSubs)
  }
}

const extractSubtitles = async (videos: string[]) => {
  for (let i = 0; i < videos.length; i++) {
    await mkvExtractor(videos[i])
  }

  const promiseArray: any[] = []
  for (let i = 0; i < videos.length; i++) {
    promiseArray.push(new Promise<void>((resolve) => {
      fs.unlink(videos[i], () => resolve())
    }))
  }

  await Promise.all(promiseArray)
}

ipcMain.handle("extract-subtitles", async (event, files: string[]) => {
  const directories = files.filter((f) => fs.lstatSync(f).isDirectory())
  const videos = files.filter((f) => path.extname(f).toLowerCase() === ".mkv")
  const subtitles = files.filter((f) => path.extname(f).toLowerCase() === ".srt" || path.extname(f).toLowerCase() === ".ass")

  let openDir = ""

  for (let i = 0; i < directories.length; i++) {
    const dir = directories[i]
    let files = fs.readdirSync(dir).map((i) => path.join(dir, i))
    let videos = files.filter((f) => path.extname(f).toLowerCase() === ".mkv")
    let subs = files.filter((f) => path.extname(f).toLowerCase() === ".srt" || path.extname(f).toLowerCase() === ".ass")
    if (videos.length) {
      await extractSubtitles(videos)
      let files = fs.readdirSync(dir).map((i) => path.join(dir, i))
      let subs = files.filter((f) => path.extname(f).toLowerCase() === ".srt" || path.extname(f).toLowerCase() === ".ass")
      await subToVtt(subs)
    }
    if (subs.length) {
      await subToVtt(subs)
    }
    try {
      fs.rmdirSync(dir)
    } catch (e) {
      console.log(e)
    }
    if (!openDir) openDir = directories[0]
  }

  if (videos.length) {
    await extractSubtitles(videos)
    let subs = fs.readdirSync(path.dirname(videos[0])).map((i) => path.join(path.dirname(videos[0]), i))
    subs = subs.filter((f) => path.extname(f).toLowerCase() === ".srt" || path.extname(f).toLowerCase() === ".ass")
    await subToVtt(subs)
    if (!openDir) openDir = videos[0]
  }

  if (subtitles.length) {
    await subToVtt(subtitles)
    if (!openDir) openDir = subtitles[0]
  }
  shell.openPath(path.dirname(openDir))
})

ipcMain.handle("rename", async (event, files: string[]) => {
  const directoryName = path.basename(path.dirname(files[0]))

  const fileNames = files.map((f) => path.basename(f, path.extname(f)))

  let renamed = false 
  for (let i = 0; i < fileNames.length; i++) {
    const regex = new RegExp(`(?<=${directoryName}) (.*?) (?=.)`, "gi")
    const bit = fileNames[i].match(regex)?.[0].trim()
    if (!bit) continue
    let newFilename = ""
    if (/\d+/.test(bit)) {
      newFilename = `${directoryName} ${Number(bit.match(/\d+/)?.[0])}`
    } else {
      let badBit = false
      for (let j = 0; j < fileNames.length; j++) {
        const testBit = fileNames[j].match(regex)?.[0].trim()
        if (`${directoryName} ${bit}` === `${directoryName} ${testBit}`) badBit = true
      }
      if (badBit) break
      newFilename = `${directoryName} ${bit}`
    }
    const newPath = path.join(path.dirname(files[i]), `${newFilename}${path.extname(files[i])}`)
    fs.renameSync(files[i], newPath)
    renamed = true
  }

  if (!renamed) {
    files = files.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
    for (let i = 0; i < files.length; i++) {
      const newPath = path.join(path.dirname(files[i]), `${directoryName} ${i + 1}${path.extname(files[i])}`)
      fs.renameSync(files[i], newPath)
    }
  }
  shell.openPath(path.dirname(files[0]))
})

const extractCover = async (dir: string, images: string[]) => {
  images = images.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
  fs.writeFileSync(`${path.dirname(dir)}/${path.basename(dir, path.extname(dir))}.jpg`, fs.readFileSync(images[0]))

  const promiseArray: any[] = []
  for (let i = 0; i < images.length; i++) {
    promiseArray.push(new Promise<void>((resolve) => {
      fs.unlink(images[i], () => resolve())
    }))
  }

  await Promise.all(promiseArray)
}

const createPDF = async (dir: string, images: string[]) => {
  images = images.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
  const pdf = new PDFDocument({autoFirstPage: false})

  pdf.pipe(fs.createWriteStream(`${path.dirname(dir)}/${path.basename(dir, path.extname(dir))}.pdf`))
  
  for (let i = 0; i < images.length; i++) {
    const image = pdf.openImage(images[i])
    pdf.addPage({size: [image.width, image.height]})
    pdf.image(image, 0, 0)
  }

  const promiseArray: any[] = []
  for (let i = 0; i < images.length; i++) {
    promiseArray.push(new Promise<void>((resolve) => {
      fs.unlink(images[i], () => resolve())
    }))
  }

  await Promise.all(promiseArray)

  pdf.end()
}

ipcMain.handle("pdf-cover", async (event, files: string[]) => {
  const directories = files.filter((f) => fs.lstatSync(f).isDirectory())
  const PDFs = files.filter((f) => path.extname(f) === ".pdf")
  const images = files.filter((f) => path.extname(f).toLowerCase() === ".jpg" 
  || path.extname(f).toLowerCase() === ".jpeg"
  || path.extname(f).toLowerCase() === ".png" 
  || path.extname(f).toLowerCase() === ".webp"
  || path.extname(f).toLowerCase() === ".avif")

  let openDir = ""

  for (let i = 0; i < PDFs.length; i++) {
    const dir = path.dirname(PDFs[i])
    const saveFilename = path.basename(PDFs[i], path.extname(PDFs[i]))
    const savePath = path.join(dir, saveFilename)
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath)
    await dumpPDFImages(PDFs[i], savePath, {type: "jpg"})
    .then(async () => {
      fs.unlinkSync(PDFs[i])
      let images = fs.readdirSync(savePath).map((i) => path.join(savePath, i))
      images = images.filter((f) => path.extname(f).toLowerCase() === ".jpg" 
        || path.extname(f).toLowerCase() === ".jpeg"
        || path.extname(f).toLowerCase() === ".png" 
        || path.extname(f).toLowerCase() === ".webp"
        || path.extname(f).toLowerCase() === ".avif")
      await extractCover(savePath, images)
      try {
        fs.rmdirSync(savePath)
      } catch (e) {
        console.log(e)
      }
    })
    .catch((e) => window?.webContents.send("debug", e))
    if (!openDir) openDir = PDFs[0]
  }

  for (let i = 0; i < directories.length; i++) {
    const dir = directories[i]
    let images = fs.readdirSync(dir).map((i) => path.join(dir, i))
    images = images.filter((f) => path.extname(f).toLowerCase() === ".jpg" 
      || path.extname(f).toLowerCase() === ".jpeg"
      || path.extname(f).toLowerCase() === ".png" 
      || path.extname(f).toLowerCase() === ".webp"
      || path.extname(f).toLowerCase() === ".avif")
    await removeDoubles(images, true)
    if (!openDir) openDir = images[0]
  }

  if (images.length) {
    await removeDoubles(images)
    if (!openDir) openDir = images[0]
  }
  shell.openPath(path.dirname(openDir))
})

ipcMain.handle("pdf", async (event, files: string[]) => {
  const directories = files.filter((f) => fs.lstatSync(f).isDirectory())
  const PDFs = files.filter((f) => path.extname(f) === ".pdf")
  const images = files.filter((f) => path.extname(f).toLowerCase() === ".jpg" 
    || path.extname(f).toLowerCase() === ".jpeg"
    || path.extname(f).toLowerCase() === ".png" 
    || path.extname(f).toLowerCase() === ".webp"
    || path.extname(f).toLowerCase() === ".avif")

  let openDir = ""

  for (let i = 0; i < directories.length; i++) {
    const dir = directories[i]
    let images = fs.readdirSync(dir).map((i) => path.join(dir, i))
    images = images.filter((f) => path.extname(f).toLowerCase() === ".jpg" 
      || path.extname(f).toLowerCase() === ".jpeg"
      || path.extname(f).toLowerCase() === ".png" 
      || path.extname(f).toLowerCase() === ".webp"
      || path.extname(f).toLowerCase() === ".avif")
    await createPDF(dir, images)
    try {
      fs.rmdirSync(dir)
    } catch (e) {
      console.log(e)
    }
    if (!openDir) openDir = directories[0]
  }

  for (let i = 0; i < PDFs.length; i++) {
    const dir = path.dirname(PDFs[i])
    const saveFilename = path.basename(PDFs[i], path.extname(PDFs[i]))
    const savePath = path.join(dir, saveFilename)
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath)
    await dumpPDFImages(PDFs[i], savePath, {type: "jpg"})
    .then(() => fs.unlinkSync(PDFs[i]))
    .catch((e) => window?.webContents.send("debug", e))
    if (!openDir) openDir = PDFs[0]
  }

  if (images.length) {
    await createPDF(images[0], images)
    if (!openDir) openDir = images[0]
  }
  shell.openPath(path.dirname(openDir))
})

ipcMain.handle("multi-open", async (event, type?: string) => {
  let title = "Convert or Extract PDF"
  let button = "Convert"
  if (type === "cover") title = "PDF or Image Directory Cover"
  if (type === "subs") title = "Convert to VTT Subtitles"
  if (type === "rename") {
    title = "Rename by Directory"
    button = "Rename"
  }
  if (type === "songcover") {
    title = "Add MP3 Cover"
    button = "Add"
  }
  if (!window) return
  const result = await dialog.showOpenDialog(window, {
    properties: ["openFile", "multiSelections"],
    buttonLabel: button,
    title
  })
  return result.filePaths
})

const subFiles = (directory: string) => {
  let files: string[] = []
  let directories: string[] = []
  let dirFiles = fs.readdirSync(directory).map((f) => `${directory}/${f}`)
  dirFiles = dirFiles.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
  for (let i = 0; i < dirFiles.length; i++) {
    if (fs.lstatSync(dirFiles[i]).isDirectory()) {
      directories.push(dirFiles[i])
      const sub = subFiles(dirFiles[i])
      files.push(...sub.files)
      directories.push(...sub.directories)
    } else {
      files.push(dirFiles[i])
    }
  }
  return {files, directories}
}

ipcMain.handle("flatten", async (event, directory: string) => {
  const {files, directories} = subFiles(directory)

  const nameCounts = {} as {[key: string]: number}
  for (const file of files) {
    const base = path.basename(file)
    nameCounts[base] = (nameCounts[base] || 0) + 1
  }

  const used = new Set<string>()

  for (const file of files) {
    const name = path.basename(file)
    let target = name

    if (nameCounts[name] > 1 || used.has(name)) {
      let renameIndex = 0
      do {
        target = `${renameIndex}_${name}`
        renameIndex++
      } while (used.has(target))
    }

    used.add(target)

    const renamePath = path.join(directory, target)
    fs.renameSync(file, renamePath)
  }

  for (const dir of directories) {
    fs.rmdirSync(dir)
  }

  shell.openPath(directory)
})

ipcMain.handle("flatten-directory", async () => {
  if (!window) return
  const result = await dialog.showOpenDialog(window, {
    properties: ["openDirectory"],
    buttonLabel: "Flatten",
    title: "Flatten Directory"
  })
  return result.filePaths[0]
})

ipcMain.handle("zoom-out", () => {
  preview?.webContents.send("zoom-out")
})

ipcMain.handle("zoom-in", () => {
  preview?.webContents.send("zoom-in")
})

const openPreview = async () => {
  if (!preview) {
    preview = new BrowserWindow({width: 800, height: 600, minWidth: 720, minHeight: 450, frame: false, hasShadow: false, resizable: true,
      show: false, transparent: initialTransparent, backgroundColor: "#00000000", center: false, webPreferences: {
      preload: path.join(__dirname, "../preload/index.js")}})
    await preview.loadFile(path.join(__dirname, "../renderer/preview.html"))
    preview?.on("closed", () => {
      preview = null
    })
  } else {
    if (preview.isMinimized()) preview.restore()
    preview.focus()
  }
}

ipcMain.handle("ready-to-show", () => {
    preview?.show()
})

ipcMain.handle("preview-realtime", async (event, info: any) => {
  preview?.webContents.send("update-buffer-realtime", info)
})

ipcMain.handle("preview", async (event, info: any) => {
  await openPreview()
  preview?.webContents.send("update-buffer", info)
})

const getDimensions = (path: string) => {
  try {
    const dimensions = imageSize(fs.readFileSync(path))
    const size = fs.statSync(path).size
    return {width: dimensions.width ?? 0, height: dimensions.height ?? 0, size}
  } catch {
    return {width: 0, height: 0, size: 0}
  }
}

ipcMain.handle("get-dimensions", async (event, path: string) => {
  return getDimensions(path)
})

ipcMain.handle("delete-duplicates", async () => {
  const hashMap = new Map()
  for (let i = 0; i < history.length; i++) {
    const source = history[i].source
    if (fs.existsSync(source)) {
      try {
        const hash = await phash(fs.readFileSync(source))
        let dupeArray = []
        let found = false
        hashMap.forEach((value, key) => {
          if (dist(key, hash) < 5) {
            dupeArray = functions.removeDuplicates([...value, source])
            hashMap.set(key, dupeArray)
            found = true
          }
        })
        if (!found) {
          dupeArray = [source]
          hashMap.set(hash, dupeArray)
        }
      } catch {
        continue
      }
    }
  }
  hashMap.forEach(async (value: string[]) => {
    if (value.length > 1) {
      let arr = []
      for (let i = 0; i < value.length; i++) {
        const {width, height} = getDimensions(value[i])
        const id = history.find((h) => h.source === value[i])?.id
        arr.push({id, width, height, source: value[i]})
      }
      arr = arr.sort((a, b) => a.width - b.width)
      while (arr.length > 1) {
        const val = arr.shift()
        let counter = 1
        let error = true
        while (error && counter < 20) {
          await functions.timeout(100)
          try {
            fs.unlinkSync(val?.source!)
            error = false
          } catch {
            // ignore
          }
          counter++
        }
        window?.webContents.send("deleted-source", {id: val?.id})
      }
    }
  })
})

ipcMain.handle("close-conversion", async (event, id: number) => {
  let index = history.findIndex((h) => h.id === id)
  if (index !== -1) history.splice(index, 1)
})

ipcMain.handle("delete-conversion", async (event, id: number) => {
  let dest = ""
  let source = ""
  let index = active.findIndex((a) => a.id === id)
  if (index !== -1) {
    active[index].action = "stop"
    dest = active[index].dest
    source = active[index].source
  } else {
    index = history.findIndex((a) => a.id === id)
    if (index !== -1) {
      dest = history[index].dest as string
      source = history[index].source
    }
  }
  if (dest) {
      let counter = 1
      let error = true
      while (error && counter < 20) {
        await functions.timeout(100)
        try {
          fs.unlinkSync(dest)
          error = false
        } catch {
          // ignore
        }
        counter++
      }
    return true
  }
  return false
})

const nextQueue = async (info: any) => {
  const index = active.findIndex((a) => a.id === info.id)
  if (index !== -1) active.splice(index, 1)
  const settings = store.get("settings", {}) as any
  let qIndex = queue.findIndex((q) => q.info.id === info.id)
  if (qIndex !== -1) {
    queue.splice(qIndex, 1)
    let concurrent = 1 // Number(settings?.queue)
    if (Number.isNaN(concurrent) || concurrent < 1) concurrent = 1
    if (active.length < concurrent) {
      const next = queue.find((q) => !q.started)
      if (next) {
        await compress(next.info)
      }
    }
  }
}

const compress = async (info: any) => {
  let qIndex = queue.findIndex((q) => q.info.id === info.id)
  if (qIndex !== -1) queue[qIndex].started = true
  const options = {
    quality: Number(info.quality),
    ignoreBelow: info.ignoreBelow,
    resizeWidth: Number(info.resizeWidth),
    resizeHeight: Number(info.resizeHeight),
    percentage: info.percentage,
    keepRatio: info.keepRatio,
    rename: info.rename,
    format: info.format,
    progressive: info.progressive
  }
  window?.webContents.send("conversion-started", {id: info.id})
  const fileSize = functions.parseFileSize(info.fileSize)
  const ignoredSize = functions.parseFileSize(options.ignoreBelow)
  if (fileSize < ignoredSize) {
    window?.webContents.send("conversion-finished", {id: info.id, output: info.source, skipped: true})
    return nextQueue(info)
  }
  const {width, height} = functions.parseNewDimensions(info.width, info.height, options.resizeWidth, options.resizeHeight, options.percentage, options.keepRatio)
  
  let {dest, overwrite} = await mainFunctions.parseDest(info.source, info.dest, options.rename, options.format, width, height)
  if (!fs.existsSync(path.dirname(dest))) fs.mkdirSync(path.dirname(dest), {recursive: true})
  const historyIndex = history.findIndex((h) => h.id === info.id)
  if (historyIndex !== -1) history[historyIndex].dest = dest
  const activeIndex = active.findIndex((a) => a.id === info.id)
  if (activeIndex !== -1) active[activeIndex].dest = dest
  let meta = []
  let output = ""
  let buffer = fs.readFileSync(info.source) as Buffer | Uint8Array
  try {
    let inMime = "image/jpeg"
    if (path.extname(info.source) === ".png") inMime = "image/png"
    meta = imagesMeta.readMeta(buffer, inMime)
    for (let i = 0; i < meta.length; i++) {
      if (typeof meta[i].value !== "string") meta[i].value = ""
      meta[i].value = meta[i].value.replaceAll("UNICODE", "").replaceAll(/\u0000/g, "")
    }
  } catch {}
  try {
    const sourceExt = path.extname(info.source).replaceAll(".", "")
    const ext = path.extname(dest).replaceAll(".", "")
    const resizeCondition = options.keepRatio ? (options.percentage ? options.resizeWidth !== 100 : true) : (options.percentage ? (options.resizeWidth !== 100 && options.resizeHeight !== 100) : true)
    let isAnimated = sourceExt === "gif"
    if (sourceExt === "webp") {
      isAnimated = functions.isAnimatedWebp(buffer)
    }
    if (ext === "gif") {
      if (resizeCondition) {
        if (process.platform === "win32") {
          const {frameArray, delayArray} = await functions.getGIFFrames(info.source)
          const newFrameArray = [] as Buffer[]
          for (let i = 0; i < frameArray.length; i++) {
            const newFrame = await sharp(frameArray[i], {limitInputPixels: false})
            .resize(width, height, {fit: "fill"})
            .toBuffer()
            newFrameArray.push(newFrame)
          }
          buffer = await functions.encodeGIF(newFrameArray, delayArray, width, height)
        } else {
          buffer = await sharp(buffer, {animated: true, limitInputPixels: false}).resize(width, height, {fit: "fill"}).gif().toBuffer()
        }
        if (options.quality !== 100) {
          buffer = await imagemin.buffer(buffer, {plugins: [
            imageminGifsicle({optimizationLevel: 3})
          ]})
        }
      } else {
        if (options.quality !== 100) {
          buffer = await imagemin([info.source], {plugins: [
            imageminGifsicle({optimizationLevel: 3})
          ]}).then((i: any) => i[0].data)
        }
      }
    } else {
      if (resizeCondition) {
        buffer = await sharp(buffer, {animated: true, limitInputPixels: false}).resize(width, height, {fit: "fill"}).toBuffer()
      }
      let s = sharp(buffer, {animated: true, limitInputPixels: false})
      if (ext === "jpg" || ext === "jpeg") s.jpeg({optimiseScans: options.progressive, quality: options.quality, trellisQuantisation: true})
      if (ext === "png") s.png({quality: options.quality})
      if (ext === "webp") s.webp({quality: options.quality})
      if (ext === "avif") s.avif({quality: options.quality})
      if (ext === "jxl") s.jxl({quality: options.quality})
      if (ext === "gif") s.gif()
      buffer = await s.toBuffer()
      if (options.quality < 95) {
        if (!isAnimated && ext !== "avif" && ext !== "jxl") {
          buffer = await imagemin.buffer(buffer, {plugins: [
            imageminMozjpeg({quality: options.quality}),
            imageminPngquant(),
            imageminWebp({quality: options.quality}),
            imageminGifsicle({optimizationLevel: 3})
          ]})
        }
      }
    }
    fs.writeFileSync(overwrite ? info.source : dest, buffer)
    if (overwrite) {
      fs.renameSync(info.source, dest)
    }
    output = dest
    if (meta?.length) {
      let outMime = "image/jpeg"
      if (path.extname(output) === ".png") outMime = "image/png"
      let metaBuffer = imagesMeta.writeMeta(fs.readFileSync(output), outMime, meta, "buffer")
      fs.writeFileSync(output, metaBuffer)
    }
    window?.webContents.send("conversion-finished", {id: info.id, output, buffer, fileSize: Buffer.byteLength(buffer)})
    return nextQueue(info)
  } catch (error) {
    console.log(error)
    window?.webContents.send("debug", error)
    window?.webContents.send("conversion-finished", {id: info.id, output: info.source, skipped: true})
    return nextQueue(info)
  }
}

ipcMain.handle("compress", async (event, info: any, startAll: boolean) => {
  const qIndex = queue.findIndex((q) => q.info.id === info.id)
  if (qIndex === -1) queue.push({info, started: false})
  if (startAll) {
    const settings = store.get("settings", {}) as any
    let concurrent = 1 // Number(settings?.queue)
    if (Number.isNaN(concurrent) || concurrent < 1) concurrent = 1
    if (active.length < concurrent) {
      active.push({id: info.id, source: info.source, dest: "", action: null})
      await compress(info)
    }
  } else {
    active.push({id: info.id, source: info.source, dest: "", action: null})
    await compress(info)
  }
})

ipcMain.handle("compress-realtime", async (event, info: any) => {
  const options = {
    quality: Number(info.quality),
    ignoreBelow: info.ignoreBelow,
    resizeWidth: Number(info.resizeWidth),
    resizeHeight: Number(info.resizeHeight),
    percentage: info.percentage,
    keepRatio: info.keepRatio,
    rename: info.rename,
    format: info.format,
    progressive: info.progressive
  }
  const fileSize = functions.parseFileSize(info.fileSize)
  const ignoredSize = functions.parseFileSize(options.ignoreBelow)
  if (fileSize < ignoredSize) {
    return {buffer: info.source, fileSize}
  }
  const {width, height} = functions.parseNewDimensions(info.width, info.height, options.resizeWidth, options.resizeHeight, options.percentage, options.keepRatio)
  const {dest} = await mainFunctions.parseDest(info.source, info.dest, "{name}", options.format, width, height)
  let buffer = fs.readFileSync(info.source) as Buffer | Uint8Array
  try {
    const sourceExt = path.extname(info.source).replaceAll(".", "")
    const ext = path.extname(dest).replaceAll(".", "")
    const resizeCondition = options.keepRatio ? (options.percentage ? options.resizeWidth !== 100 : true) : 
      (options.percentage ? (options.resizeWidth !== 100 && options.resizeHeight !== 100) : true)
    let isAnimated = sourceExt === "gif"
    if (sourceExt === "webp") {
      isAnimated = functions.isAnimatedWebp(buffer)
    }
    if (ext === "gif") {
      if (resizeCondition) {
        if (process.platform === "win32") {
          const {frameArray, delayArray} = await functions.getGIFFrames(info.source)
          const newFrameArray = [] as Buffer[]
          for (let i = 0; i < frameArray.length; i++) {
            const newFrame = await sharp(frameArray[i], {limitInputPixels: false})
            .resize(width, height, {fit: "fill"})
            .toBuffer()
            newFrameArray.push(newFrame)
          }
          buffer = await functions.encodeGIF(newFrameArray, delayArray, width, height)
        } else {
          buffer = await sharp(buffer, {animated: true, limitInputPixels: false}).resize(width, height, {fit: "fill"}).gif().toBuffer()
        }
        if (options.quality !== 100) {
          buffer = await imagemin.buffer(buffer, {plugins: [
            imageminGifsicle({optimizationLevel: 3})
          ]})
        }
      } else {
        if (options.quality !== 100) {
          buffer = await imagemin([info.source], {plugins: [
            imageminGifsicle({optimizationLevel: 3})
          ]}).then((i: any) => i[0].data)
        }
      }
    } else {
      if (resizeCondition) {
        buffer = await sharp(buffer, {animated: true, limitInputPixels: false}).resize(width, height, {fit: "fill"}).toBuffer()
      }
      let s = sharp(buffer, {animated: true, limitInputPixels: false})
      if (ext === "jpg" || ext === "jpeg") s.jpeg({optimiseScans: options.progressive, quality: options.quality})
      if (ext === "png") s.png({quality: options.quality})
      if (ext === "webp") s.webp({quality: options.quality})
      if (ext === "avif") s.avif({quality: options.quality})
      if (ext === "jxl") s.jxl({quality: options.quality})
      if (ext === "gif") s.gif()
      buffer = await s.toBuffer()
      if (options.quality < 95) {
        if (!isAnimated && ext !== "avif" && ext !== "jxl") {
          buffer = await imagemin.buffer(buffer, {plugins: [
            imageminMozjpeg({quality: options.quality}),
            imageminPngquant(),
            imageminWebp({quality: options.quality}),
            imageminGifsicle({optimizationLevel: 3})
          ]})
        }
      }
    }
    return {buffer, fileSize: Buffer.byteLength(buffer)}
  } catch (error) {
    console.log(error)
    return {buffer: info.source, fileSize}
  }
})

ipcMain.handle("update-concurrency", async (event, concurrent) => {
  if (Number.isNaN(concurrent) || concurrent < 1) concurrent = 1
  let counter = active.length
  while (counter < concurrent) {
    const next = queue.find((q) => !q.started)
    if (next) {
      counter++
      await compress(next.info)
    } else {
      break
    }
  }
})


ipcMain.handle("move-queue", async (event, id: number) => {
  const settings = store.get("settings", {}) as any
  let concurrent = 1 // Number(settings?.queue)
  if (Number.isNaN(concurrent) || concurrent < 1) concurrent = 1
  if (id) {
    let qIndex = queue.findIndex((q) => q.info.id === id)
    if (qIndex !== -1) queue.splice(qIndex, 1)
  }
  if (active.length < concurrent) {
    const next = queue.find((q) => !q.started)
    if (next) {
      await compress(next.info)
    }
  }
})

ipcMain.handle("update-color", (event, color: string) => {
  window?.webContents.send("update-color", color)
})

ipcMain.handle("init-settings", () => {
  return store.get("settings", null)
})

ipcMain.handle("store-settings", (event, settings) => {
  const prev = store.get("settings", {}) as object
  store.set("settings", {...prev, ...settings})
})

ipcMain.handle("get-theme", () => {
  return store.get("theme", "light")
})

ipcMain.handle("save-theme", (event, theme: string) => {
  store.set("theme", theme)
  const transparent = store.get("transparent", false)
  const os = store.get("os", "mac")
  preview?.webContents.send("update-theme", theme, transparent, os)
  window?.webContents.send("update-theme", theme, transparent, os)
})

ipcMain.handle("get-os", () => {
  return store.get("os", process.platform === "darwin" ? "mac" : "windows")
})

ipcMain.handle("save-os", (event, os: string) => {
  store.set("os", os)
  const theme = store.get("theme", "light")
  const transparent = store.get("transparent", false)
  preview?.webContents.send("update-theme", theme, transparent, os)
  window?.webContents.send("update-theme", theme, transparent, os)
})

ipcMain.handle("get-transparent", () => {
  return store.get("transparent", false)
})

ipcMain.handle("save-transparent", (event, transparent: boolean) => {
  store.set("transparent", transparent)
  const theme = store.get("theme", "light")
  const os = store.get("os", "mac")
  preview?.webContents.send("update-theme", theme, transparent, os)
  window?.webContents.send("update-theme", theme, transparent, os)
})

ipcMain.handle("get-pinned", () => {
  return store.get("pinned", false)
})

ipcMain.handle("save-pinned", (event, pinned: boolean) => {
  store.set("pinned", pinned)
  window?.setAlwaysOnTop(pinned)
  preview?.setAlwaysOnTop(pinned)
})

ipcMain.handle("open-location", async (event, location: string, create?: boolean) => {
  if (create && !fs.existsSync(location)) fs.mkdirSync(location, {recursive: true})
  if (!fs.existsSync(location)) return
  if (fs.statSync(location).isDirectory()) {
    shell.openPath(path.normalize(location))
  } else {
    shell.showItemInFolder(path.normalize(location))
  }
})

ipcMain.handle("start-all", () => {
  window?.webContents.send("start-all")
})

ipcMain.handle("clear-all", () => {
  window?.webContents.send("clear-all")
})

ipcMain.handle("add-files", (event, files: string[], identifers: number[]) => {
  for (let i = 0; i < files.length; i++) {
    history.push({id: identifers[i], source: files[i]})
  }
  window?.webContents.send("add-files", files, identifers)
})

ipcMain.handle("add-file-id", (event, file: string, pos: number, id: number) => {
    history.push({id, source: file})
    window?.webContents.send("add-file-id", file, pos, id)
})

ipcMain.handle("add-file", (event, file: string, pos: number) => {
    window?.webContents.send("add-file", file, pos)
})

ipcMain.handle("select-files", async () => {
  if (!window) return
  const files = await dialog.showOpenDialog(window, {
    filters: [
      {name: "All Files", extensions: ["*"]},
      {name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "avif", "tiff"]},
      {name: "GIF", extensions: ["gif"]}
    ],
    properties: ["multiSelections", "openFile"]
  })
  const filePaths = files.filePaths
  if (filePaths.length === 1) {
    if (fs.lstatSync(filePaths[0]).isDirectory()) {
      return fs.readdirSync(filePaths[0]).map((f) => `${filePaths[0]}/${f}`)
    }
  }
  return filePaths
})

ipcMain.handle("get-downloads-folder", async () => {
  if (store.has("downloads")) {
    return store.get("downloads")
  } else {
    const downloads = app.getPath("downloads")
    store.set("downloads", downloads)
    return downloads
  }
})

ipcMain.handle("select-directory", async (event, dir: string) => {
  if (!window) return
  if (dir === undefined) {
    const result = await dialog.showOpenDialog(window, {
      properties: ["openDirectory"]
    })
    dir = result.filePaths[0]
  }
  if (dir) {
    store.set("downloads", dir)
    return dir
  }
})

ipcMain.handle("context-menu", (event, {hasSelection}) => {
  const template: MenuItemConstructorOptions[] = [
    {label: "Copy", enabled: hasSelection, role: "copy"},
    {label: "Paste", role: "paste"}
  ]

  const menu = Menu.buildFromTemplate(template)
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) menu.popup({window})
})

const applicationMenu = () =>  {
  const template: MenuItemConstructorOptions[] = [
    {role: "appMenu"},
    {
      label: "File",
      submenu: [
        {
          label: "Open", 
          accelerator: "CmdOrCtrl+O",
          click: (item, window) => {
            const win = window as BrowserWindow
            win.webContents.send("upload")
          }
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        {role: "copy"},
        {role: "paste"}
      ]
    },
    {role: "windowMenu"},
    {
      role: "help",
      submenu: [
        {role: "reload"},
        {role: "forceReload"},
        {role: "toggleDevTools"},
        {type: "separator"},
        {label: "Online Support", click: () => shell.openExternal(pack.repository.url)}
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

const singleLock = app.requestSingleInstanceLock()

if (!singleLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore()
      window.focus()
    }
  })

  app.on("ready", () => {
    window = new BrowserWindow({width: 800, height: 600, minWidth: 720, minHeight: 450, frame: false, resizable: true, hasShadow: false,
      transparent: initialTransparent, show: false, backgroundColor: "#00000000", center: true, webPreferences: {
        preload: path.join(__dirname, "../preload/index.js")}})
    window.loadFile(path.join(__dirname, "../renderer/index.html"))
    window.removeMenu()
    applicationMenu()
    if (process.platform === "darwin") {
      if (process.env.DEVELOPMENT === "true") {
        fs.chmodSync(path.join(__dirname, "../../vendor/mac/cjpeg"), "777")
        fs.chmodSync(path.join(__dirname, "../../vendor/mac/cwebp"), "777")
        fs.chmodSync(path.join(__dirname, "../../vendor/mac/gifsicle"), "777")
        fs.chmodSync(path.join(__dirname, "../../vendor/mac/pngquant"), "777")
      }
    }
    localShortcut.register(window, "Control+Shift+I", () => {
      window?.webContents.openDevTools()
      preview?.webContents.openDevTools()
    })
    window.webContents.on("did-finish-load", () => {
      window?.show()
    })
    window.on("close", () => {
      preview?.close()
    })
    window.on("closed", () => {
      window = null
    })
  })
}
