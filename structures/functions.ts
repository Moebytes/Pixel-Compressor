
import GifEncoder from "gif-encoder"
import pixels from "image-pixels"
import gifFrames from "gif-frames"
import path from "path"
import {lightColorList, darkColorList} from "../LocalStorage"

const images = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".jxl", ".tiff"]
const gifs = [".gif"]

export default class Functions {
    public static arrayIncludes = (str: string, arr: string[]) => {
        for (let i = 0; i < arr.length; i++) {
            if (str.includes(arr[i])) return true
        }
        return false
    }

    public static cleanTitle = (str: string) => {
        const ext = path.extname(str)
        const split = str.match(/.{1,30}/g)?.join(" ").replace(ext, "")!
        return `${split.slice(0, 70)}${ext}`
    }

    public static getType = (str: string) => {
        if (Functions.arrayIncludes(path.extname(str), images)) return "image"
        if (Functions.arrayIncludes(path.extname(str), gifs)) return "gif"
    }

    public static arrayRemove = <T>(arr: T[], val: T) => {
        return arr.filter((item) => item !== val)
    }

    public static removeDuplicates = <T>(array: T[]) => {
        return array.filter((a, b) => array.indexOf(a) === b)
    }

    public static timeout = async (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    public static countDecimals = (value: number, max?: number) => {
        const count = value % 1 ? value.toString().split(".")[1].length : 0
        if (max && count > max) return max
        return count
    }

    public static readableFileSize = (bytes: number) => {
        const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
        return `${Number((bytes / Math.pow(1024, i)).toFixed(2))} ${["B", "KB", "MB", "GB", "TB"][i]}`
    }

    public static escape = (str: string) => {
        return path.normalize(str).replace(/(?<!\\)\\(?!\\)/g, "/")
    }

    public static parseFileSize = (size: string) => {
        if (!size) return 0
        const num = parseFloat(size)
        if (Number.isNaN(num)) return 0
        const type = size.replace(/\d+/g, "").replaceAll(".", "").trim()
        let multiplier = 1
        if (type === "KB") multiplier = 1000
        if (type === "MB") multiplier = 1000000
        if (type === "GB") multiplier = 1000000000
        if (type === "TB") multiplier = 1000000000000
        return num * multiplier
    }

    public static parseNewDimensions = (width: number, height: number, resizeWidth: number, resizeHeight: number, percentage: boolean, keepRatio: boolean) => {
        let newWidth = width
        let newHeight = height
        if (keepRatio) {
            if (percentage) {
                newWidth = width * (resizeWidth / 100)
                newHeight = height * (resizeWidth / 100)
            } else {
                const ratio = resizeWidth / width 
                newWidth = resizeWidth
                newHeight = height * ratio
            }
        } else {
            if (percentage) {
                newWidth = width * (resizeWidth / 100)
                newHeight = height * (resizeHeight / 100)
            } else {
                newWidth = resizeWidth
                newHeight = resizeHeight
            }
        }
        return {width: parseInt(String(newWidth)), height: parseInt(String(newHeight))}
    }

    public static streamToBuffer = async (stream: NodeJS.ReadableStream) => {
        const chunks: Buffer[] = []
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
          stream.on("error", (err) => reject(err))
          stream.on("end", () => resolve(Buffer.concat(chunks)))
        })
        return buffer
    }

    public static arrayBufferToBuffer(arrayBuffer: Buffer | ArrayBuffer) {
        if (Buffer.isBuffer(arrayBuffer)) {
            return arrayBuffer
        }
        return Buffer.from(arrayBuffer)
    }

    public static encodeGIF = async (frames: Buffer[], delays: number[], width: number, height: number) => {
        const gif = new GifEncoder(width, height, {highWaterMark: 5 * 1024 * 1024})
        gif.setQuality(10)
        gif.setRepeat(0)
        gif.writeHeader()
        let counter = 0

        const addToGif = async (frames: Buffer[]) => {
            if (!frames[counter]) {
                gif.finish()
            } else {
                const {data} = await pixels(frames[counter])
                gif.setDelay(delays[counter])
                gif.addFrame(data)
                counter++
                addToGif(frames)
            }
        }
        await addToGif(frames)
        return Functions.streamToBuffer(gif as NodeJS.ReadableStream)
    }

    public static getGIFFrames = async (image: string, options?: {speed?: number, reverse?: boolean, cumulative?: boolean}) => {
        if (!options) options = {} as {speed: number, reverse: boolean, cumulative: boolean}
        if (!options.speed) options.speed = 1
        if (!options.reverse) options.reverse = false
        if (!options.cumulative) options.cumulative = true
        const frames = await gifFrames({url: image, frames: "all", outputType: "png", cumulative: options.cumulative})
        let frameArray = [] as Buffer[]
        let delayArray = [] as number[]
        const constraint = options.speed > 1 ? frames.length / options.speed : frames.length
        let step = Math.ceil(frames.length / constraint)
        for (let i = 0; i < frames.length; i += step) {
            frameArray.push(await Functions.streamToBuffer(frames[i].getImage()))
            delayArray.push(frames[i].frameInfo.delay * 10)
        }
        if (options.speed < 1) delayArray = delayArray.map((n) => n / options?.speed!)
        if (options.reverse) {
            frameArray = frameArray.reverse()
            delayArray = delayArray.reverse()
        }
        return {frameArray, delayArray}
    }

    public static bufferToBase64 = (buffer: Buffer, type: string) => {
        return `data:${type};base64,${buffer.toString("base64")}`
    }

    public static ass2vtt = (ass: string) => {
        const parseTime = (timeString: string) => {
            const parts = timeString.split(":").map(parseFloat)
            let seconds = parts[0] * 3600 + parts[1] * 60 + parts[2] as any
            const hours = Math.floor(seconds / 3600)
            seconds %= 3600
            const minutes = Math.floor(seconds / 60)
            seconds %= 60
            seconds = seconds.toFixed(3)
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(6, "0")}`
        }
      
        const lines = ass.split("\n")
        const newLines = ["WEBVTT"]
      
        const styles = []
        const styleKeys = ["Name", "Fontname", "Fontsize", "PrimaryColour", "SecondaryColour", 
                      "OutlineColour", "BackColour", "Bold", "Italic", "Underline", "Strikeout", 
                      "ScaleX", "ScaleY", "Spacing", "Angle", "BorderStyle", "Outline", "Shadow", 
                      "Alignment", "MarginL", "MarginR", "MarginV", "Encoding"]
        const dialogueKeys = ["Layer", "Start", "End", "Style", "Name", "MarginL", "MarginR", "MarginV", "Effect", "Text"]
        let counter = 1
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]
            if (lines[i].startsWith("Style")) {
                const values = lines[i].replace("Style: ", "").split(",")
                let obj = {} as any
                for (let j = 0; j < values.length; j++) {
                    obj[styleKeys[j]] = values[j]
                }
                styles.push(obj)
            }
            if (lines[i].startsWith("Dialogue")) {
                let values = lines[i].replace("Dialogue: ", "").split(",")
                values = values.slice(0, 9).concat(values.slice(9).join(' '))
                let obj = {} as any
                for (let j = 0; j < values.length; j++) {
                    obj[dialogueKeys[j]] = values[j]
                }
                //const styling = styles.find((s) => s.Name === obj.Style)
                let text = obj.Text.replace(/\\N/g, "\n").replace(/\{.*?\}/g, "").trim()
                const line = `\n${counter++}\n${parseTime(obj.Start)} --> ${parseTime(obj.End)}\n${text}`
                newLines.push(line)
            }
        }
        return newLines.join("\n")
      }

    public static isAnimatedWebp = (buffer: Buffer | Uint8Array) => {
        let str = buffer.toString("utf-8")
        if (str.includes("ANMF")) {
            return true
        } else {
            return false
        }
    }

    public static updateTheme = (theme: string, transparent?: boolean) => {
        if (typeof window === "undefined") return
        const selectedTheme = theme === "light" ? lightColorList : darkColorList

        Object.entries(selectedTheme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value)
        })

        if (transparent) {
            document.documentElement.style.setProperty("--background", "transparent")
            document.documentElement.style.setProperty("--navColor", "transparent")
            document.documentElement.style.setProperty("--previewBG", "transparent")
            document.documentElement.style.setProperty("--previewBG2", "transparent")
        }
    }
}
