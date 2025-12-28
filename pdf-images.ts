import {createCanvas} from "@napi-rs/canvas"
import path from "path"
import fs from "fs"

const pdfjs = require("pdfjs-dist/build/pdf.js")

interface Options {
    width?: number
    height?: number
    dpi?: number
    pageNumbers?: number[], 
    type?: "jpg" | "png" | "webp" | "avif"
}

const renderPage = async (pdfDocument: any, pageNumber: number, options: Options = {}) => {
    const page = await pdfDocument.getPage(pageNumber)
    let viewport = page.getViewport({scale: 1.0})
    let newScale = 1.0
    if (options.width) {
        newScale = options.width / viewport.width
    } else if (options.height) {
        newScale = options.height / viewport.height
    }
    if (newScale != 1 && newScale > 0) {
        viewport = page.getViewport({scale: newScale})
    }

    if (!options.dpi) options.dpi = 300
    const dpiScale = options.dpi / 72

    const canvas = createCanvas(
        Math.floor(viewport.width * dpiScale),
        Math.floor(viewport.height * dpiScale)
    )
    const ctx = canvas.getContext("2d")
    ctx.setTransform(dpiScale, 0, 0, dpiScale, 0, 0)

    const canvasFactory = {
        create: (width: number, height: number) => {
            const canvas = createCanvas(width, height)
            const context = canvas.getContext("2d")
            return {canvas, context}
        },
        reset: (ctx: any, width: number, height: number) => {
            ctx.canvas.width = width
            ctx.canvas.height = height
        },
        destroy: (ctx: any) => {
            ctx.canvas.width = 1
            ctx.canvas.height = 1
            ctx.canvas = null
            ctx.context = null
        }
    }

    await page.render({canvasContext: ctx, viewport, canvasFactory}).promise

    let mime = "image/jpeg" as any
    if (options.type === "png") mime = "image/png"
    if (options.type === "webp") mime = "image/webp"
    if (options.type === "avif") mime = "image/avif"

    return ctx.canvas.toBuffer(mime)
}

const dumpPDFImages = async (pdf: string | Buffer | Uint8Array, destFolder?: string, options?: Options) => {
    if (!options) options = {}
    if (!options.type) options.type = "png"
    let pdfData = null as any
    if (typeof pdf === "string") {
        if (pdf.startsWith("http") || pdf.startsWith("file://")) {
            const arrayBuffer = await fetch(pdf).then((r) => r.arrayBuffer())
            pdfData = new Uint8Array(arrayBuffer)
        } else if (pdf.includes("base64")) {
            pdfData = new Uint8Array(Buffer.from(pdf.split(",")[1], "base64"))
        } else {
            pdfData = new Uint8Array(fs.readFileSync(pdf))
        }
    } else if (Buffer.isBuffer(pdf)) {
        pdfData = new Uint8Array(pdf)
    } else {
        pdfData = pdf
    }

    const pdfDocument = await pdfjs.getDocument({data: pdfData, disableFontFace: true, verbosity: 0}).promise
    const saveFilename = destFolder ? path.basename(destFolder, path.extname(destFolder)) : "frame"
    if (!destFolder) destFolder = path.join(path.dirname(pdf as string), "frames")
    if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, {recursive: true})

    let errors = [] as string[]
    if (options.pageNumbers) {
        for (let i = 1; i <= options.pageNumbers.length - 1; i++) {
            try {
                let currentPage = await renderPage(pdfDocument, options.pageNumbers[i - 1], options)
                let dest = path.join(destFolder, `${saveFilename}-${String(i).padStart(3, "0")}.${options.type}`)
                fs.writeFileSync(dest, new Uint8Array(currentPage))
            } catch {
                console.log(`Error: ${i} / ${ options.pageNumbers.length - 1}`)
                errors.push(i.toString())
            }
        }
    } else {
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            try {
                let currentPage = await renderPage(pdfDocument, i, options)
                let dest = path.join(destFolder, `${saveFilename}-${String(i).padStart(3, "0")}.${options.type}`)
                fs.writeFileSync(dest, new Uint8Array(currentPage))
            } catch {
                console.log(`Error: ${i} / ${pdfDocument.numPages}`)
                errors.push(i.toString())
            }
        }
    }
    if (errors.length) {
        console.log(`Error pages: ${errors.join(", ")}`)
    }

    return destFolder
}

export default dumpPDFImages