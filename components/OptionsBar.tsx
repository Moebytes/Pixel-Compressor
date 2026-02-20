import React, {useEffect, useState} from "react"
import {Dropdown, DropdownButton} from "react-bootstrap"
import folderButton from "../assets/icons/folder.png"
import folderButtonHover from "../assets/icons/folder-hover.png"
import {useCompressSelector, useCompressActions} from "../store"
import Slider from "rc-slider"
import functions from "../structures/functions"
import "./styles/optionsbar.less"

const OptionsBar: React.FunctionComponent = (props) => {
    const {quality, overwrite, ignoreBelow, resizeWidth, resizeHeight,
        percentage, keepRatio, rename, format, progressive, directory
    } = useCompressSelector()
    const {setQuality, setOverwrite, setIgnoreBelow, setResizeWidth, setResizeHeight,
        setPercentage, setKeepRatio, setRename, setFormat, setProgressive, setDirectory
    } = useCompressActions()
    const [folderHover, setFolderHover] = useState(false)
    const [id, setID] = useState(1)

    useEffect(() => {
        window.ipcRenderer.invoke("get-downloads-folder").then((f) => setDirectory(f))
        initSettings()
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

    useEffect(() => {
        window.ipcRenderer.invoke("store-settings", {quality, directory, overwrite, ignoreBelow, resizeWidth, resizeHeight, 
        percentage, keepRatio, rename, format, progressive})
        window.ipcRenderer.on("on-drop", onDrop)
        return () => {
            window.ipcRenderer.removeListener("on-drop", onDrop)
        }
    })
    
    const initSettings = async () => {
        const settings = await window.ipcRenderer.invoke("init-settings")
        if (settings) {
            setQuality(settings.quality)
            setOverwrite(settings.overwrite)
            setIgnoreBelow(settings.ignoreBelow)
            setResizeWidth(settings.resizeWidth)
            setResizeHeight(settings.resizeHeight)
            setPercentage(settings.percentage)
            setKeepRatio(settings.keepRatio)
            setRename(settings.rename)
            setFormat(settings.format)
            setProgressive(settings.progressive)
        }
    }
    
    const changeDirectory = async () => {
        const dir = await window.ipcRenderer.invoke("select-directory")
        if (dir) setDirectory(dir)
    }

    const handleIgnoreBelow = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value 
        setIgnoreBelow(value)
    }

    const handleResizeWidth = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value 
        setResizeWidth(value)
    }

    const handleResizeHeight = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value 
        setResizeHeight(value)
    }

    const handleRename = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value 
        setRename(value)
    }

    const onDrop = (event: any, files: any) => {
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

    return (
        <section className="options-bar">
            <div className="options-bar-row">
                <button onClick={() => upload()} className="upload-button" ><span>Upload</span></button>
                <p className="options-bar-text">Quality:</p>
                <Slider className="options-slider" onChange={(value) => setQuality(value as number)} min={1} max={100} step={1} value={quality}/>
                <p className="options-bar-text">{quality}%</p>
            </div>
            <div className="options-bar-row">
                <div className="download-location">
                    <img className="download-location-img" width="25" height="25" src={folderHover ? folderButtonHover : folderButton} onMouseEnter={() => setFolderHover(true)} onMouseLeave={() => setFolderHover(false)} onClick={changeDirectory}/>
                    <p><span className="download-location-text" onDoubleClick={() => window.shell.openPath(directory)}>{directory}</span></p>
                </div>
                <div className="options-bar-box">
                    <input className="options-bar-checkbox" type="checkbox" checked={overwrite} onChange={() => setOverwrite(!overwrite)}/>
                    <p className="options-bar-text pointer" onClick={() => setOverwrite(!overwrite)}>Overwrite</p>
                </div>
                <div className="options-bar-box">
                    <p className="options-bar-text">Ignore Below:</p>
                    <input className="options-bar-input wide" type="text" value={ignoreBelow} onChange={handleIgnoreBelow}/>
                </div>
            </div>
            <div className="options-bar-row">
                <div className="options-bar-box">
                    <input className="options-bar-checkbox" type="checkbox" checked={percentage} onChange={() => setPercentage(!percentage)}/>
                    <p className="options-bar-text pointer" onClick={() => setPercentage(!percentage)}>Percentage</p>
                </div>
                <div className="options-bar-box">
                    <input className="options-bar-checkbox" type="checkbox" checked={keepRatio} onChange={() => setKeepRatio(!keepRatio)}/>
                    <p className="options-bar-text pointer" onClick={() => setKeepRatio(!keepRatio)}>Keep Ratio</p>
                </div>
                {keepRatio ?
                <div className="options-bar-box">
                    <p className="options-bar-text">Resize:</p>
                    <input className="options-bar-input" type="text" value={resizeWidth} onChange={handleResizeWidth}/>
                    <p className="options-bar-text">{percentage ? "%" : "px"}</p>
                </div>
                :
                <>
                <div className="options-bar-box">
                    <p className="options-bar-text">Width:</p>
                    <input className="options-bar-input" type="text" value={resizeWidth} onChange={handleResizeWidth}/>
                    <p className="options-bar-text">{percentage ? "%" : "px"}</p>
                </div>
                <div className="options-bar-box">
                    <p className="options-bar-text">Height:</p>
                    <input className="options-bar-input" type="text" value={resizeHeight} onChange={handleResizeHeight}/>
                    <p className="options-bar-text">{percentage ? "%" : "px"}</p>
                </div>
                </>
                }
            </div>
            <div className="options-bar-row">
                <div className="options-bar-box">
                    <p className="options-bar-text">Rename:</p>
                    <input className="options-bar-input wide" type="text" value={rename} onChange={handleRename}/>
                </div>
                <div className="options-bar-box">
                    <p className="options-bar-text">Format: </p>
                    <DropdownButton title={format} drop="down">
                        <Dropdown.Item active={format === "original"} onClick={() => setFormat("original")}>original</Dropdown.Item>
                        <Dropdown.Item active={format === "png"} onClick={() => setFormat("png")}>png</Dropdown.Item>
                        <Dropdown.Item active={format === "jpg"} onClick={() => setFormat("jpg")}>jpg</Dropdown.Item>
                        <Dropdown.Item active={format === "gif"} onClick={() => setFormat("gif")}>gif</Dropdown.Item>
                        <Dropdown.Item active={format === "webp"} onClick={() => setFormat("webp")}>webp</Dropdown.Item>
                        <Dropdown.Item active={format === "avif"} onClick={() => setFormat("avif")}>avif</Dropdown.Item>
                        <Dropdown.Item active={format === "jxl"} onClick={() => setFormat("jxl")}>jxl</Dropdown.Item>
                    </DropdownButton>
                </div>
                <div className="options-bar-box">
                    <input className="options-bar-checkbox" type="checkbox" checked={progressive} onChange={() => setProgressive(!progressive)}/>
                    <p className="options-bar-text pointer" onClick={() => setProgressive(!progressive)}>Progressive</p>
                </div>
            </div>
        </section>
    )
}

export default OptionsBar