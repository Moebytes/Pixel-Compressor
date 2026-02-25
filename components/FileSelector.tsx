import React, {useEffect, useEffectEvent, useState} from "react"
import {useDropzone} from "react-dropzone"
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
        const dragOver = () => {
            setDrag(true)
        }
        const dragLeave = () => {
            setDrag(false)
        }
        window.ipcRenderer.on("add-file", addFile)
        window.ipcRenderer.on("upload", upload)
        document.addEventListener("dragover", dragOver)
        document.addEventListener("dragleave", dragLeave)
        document.addEventListener("drop", dragLeave)
        return () => {
            window.ipcRenderer.removeListener("add-file", addFile)
            window.ipcRenderer.removeListener("upload", upload)
            document.removeEventListener("dragover", dragOver)
            document.removeEventListener("dragleave", dragLeave)
            document.removeEventListener("drop", dragLeave)
        }
    }, [])

    const onDrop = async (files: any) => {
        files = files.map((f: any) => f.path)
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
    }

    const upload = async () => {
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
    }

    const {getRootProps, isDragActive} = useDropzone({onDrop}) 

    const setFilter = drag ? isDragActive : hover
    return (
        <section className="file-selector" {...getRootProps()}>
            <div className="file-selector-img">
                {isDragActive ?
                <FileSelectorDragIcon className="file-selector-img-text" style={{filter: setFilter ? "brightness(0) invert(1)" : ""}}/> :
                <FileSelectorIcon className="file-selector-img-text" style={{filter: setFilter ? "brightness(0) invert(1)" : ""}}/>}
            </div>
            <div className="file-selector-hover" onClick={upload} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}></div>
        </section>
    )
}

export default FileSelector