/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pixel Compressor - A cute image compressor ❤              *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useEffectEvent, useState} from "react"
import FileSelectorIcon from "../assets/svg/file-selector.svg"
import FileSelectorDragIcon from "../assets/svg/file-selector-drag.svg"
import functions from "../structures/functions"
import "./styles/fileselector.less"

const FileSelector: React.FunctionComponent = (props) => {
    const [hover, setHover] = useState(false)
    const [drag, setDrag] = useState(false)
    const [id, setID] = useState(1)

    useEffect(() => {
        const addFile = (event: any, file: string, pos: number) => {
            setID((prev) => {
                window.ipcRenderer.invoke("add-file-id", file, pos, prev)
                return prev + 1
            })
        }
        window.ipcRenderer.on("add-file", addFile)
        window.ipcRenderer.on("upload", upload)
        return () => {
            window.ipcRenderer.removeListener("add-file", addFile)
            window.ipcRenderer.removeListener("upload", upload)
        }
    }, [])

    const drop = useEffectEvent((event: React.DragEvent) => {
        event.preventDefault()
        setDrag(false)

        let files = [] as string[]
        for (let i = 0; i < event.dataTransfer.files.length; i++) {
            files.push(window.webUtils.getPathForFile(event.dataTransfer.files[i]))
        }

        if (files[0]) {
            const identifers = []
            let counter = id
            for (let i = 0; i < files.length; i++) {
                if (!functions.getType(files[i])) continue
                identifers.push(counter)
                counter += 1
                setID((prev) => prev + 1)
            }
            window.ipcRenderer.invoke("add-files", files, identifers)
        }
    })

    const dragOver = (event: React.DragEvent) => {
        event.preventDefault()
        setDrag(true)
    }

    const dragLeave = () => {
        setDrag(false)
    }

    const upload = useEffectEvent(async () => {
        const files = await window.ipcRenderer.invoke("select-files")
        if (files[0]) {
            const identifers = []
            let counter = id
            for (let i = 0; i < files.length; i++) {
                if (!functions.getType(files[i])) continue
                identifers.push(counter)
                counter += 1
                setID((prev) => prev + 1)
            }
            window.ipcRenderer.invoke("add-files", files, identifers)
        }
    })

    return (
        <section className="file-selector" onDrop={drop} onDragOver={dragOver} onDragLeave={dragLeave}>
            <div className="file-selector-img">
                {drag ?
                <FileSelectorDragIcon className="file-selector-img-text" style={{filter: hover ? "brightness(0) invert(1)" : ""}}/> :
                <FileSelectorIcon className="file-selector-img-text" style={{filter: hover ? "brightness(0) invert(1)" : ""}}/>}
            </div>
            <div className="file-selector-hover" onClick={upload} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}></div>
        </section>
    )
}

export default FileSelector