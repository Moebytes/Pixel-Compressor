import React, {useState} from "react"
import {useThemeSelector, useThemeActions} from "../store"
import CircleIcon from "../assets/svg/circle.svg"
import CircleCloseIcon from "../assets/svg/circle-close.svg"
import CircleMinimizeIcon from "../assets/svg/circle-minimize.svg"
import CircleMaximizeIcon from "../assets/svg/circle-maximize.svg"
import CloseIcon from "../assets/svg/close.svg"
import MinimizeIcon from "../assets/svg/minimize.svg"
import MaximizeIcon from "../assets/svg/maximize.svg"
import Icon from "../assets/svg/icon.svg"
import MP3Icon from "../assets/svg/mp3.svg"
import VTTIcon from "../assets/svg/vtt.svg"
import RenameIcon from "../assets/svg/rename.svg"
import CoverIcon from "../assets/svg/cover.svg"
import PDFIcon from "../assets/svg/pdf.svg"
import FlattenIcon from "../assets/svg/flatten.svg"
import TransparentIcon from "../assets/svg/transparent.svg"
import PinIcon from "../assets/svg/pin.svg"
import LightIcon from "../assets/svg/light.svg"
import DarkIcon from "../assets/svg/dark.svg"
import WindowsIcon from "../assets/svg/windows.svg"
import MacIcon from "../assets/svg/mac.svg"
import "./styles/titlebar.less"

const TitleBar: React.FunctionComponent = (props) => {
    const {theme, os, transparent, pinned} = useThemeSelector()
    const {setTheme, setOS, setTransparent, setPinned} = useThemeActions()
    const [iconHover, setIconHover] = useState(false)

    const onMouseDown = () => {
        window.ipcRenderer.send("moveWindow")
    }

    const close = () => {
        window.ipcRenderer.invoke("close")
    }

    const minimize = async () => {
        await window.ipcRenderer.invoke("minimize")
        setIconHover(false)
    }

    const maximize = () => {
        window.ipcRenderer.invoke("maximize")
    }

    const mp3 = async () => {
        const files = await window.ipcRenderer.invoke("multi-open", "songcover")
        if (files?.[0]) window.ipcRenderer.invoke("song-cover", files)
    }

    const vtt = async () => {
        const files = await window.ipcRenderer.invoke("multi-open", "subs")
        if (files?.[0]) window.ipcRenderer.invoke("extract-subtitles", files)
    }

    const rename = async () => {
        const files = await window.ipcRenderer.invoke("multi-open", "rename")
        if (files?.[0]) window.ipcRenderer.invoke("rename", files)
    }

    const cover = async () => {
        const files = await window.ipcRenderer.invoke("multi-open", "cover")
        if (files?.[0]) window.ipcRenderer.invoke("pdf-cover", files)
    }
    
    const pdf = async () => {
        const files = await window.ipcRenderer.invoke("multi-open")
        if (files?.[0]) window.ipcRenderer.invoke("pdf", files)
    }

    const flatten = async () => {
        const directory = await window.ipcRenderer.invoke("flatten-directory")
        if (directory) window.ipcRenderer.invoke("flatten", directory)
    }

    const switchTheme = () => {
        setTheme(theme === "light" ? "dark" : "light")
    }

    const switchOSStyle = () => {
        setOS(os === "mac" ? "windows" : "mac")
        window.ipcRenderer.invoke("save-os", os === "mac" ? "windows" : "mac")
    }

    const switchTransparency = () => {
        setTransparent(!transparent)
    }

    const switchPinned = () => {
        setPinned(!pinned)
    }

    const macTitleBar = () => {
        return (
            <div className="title-group-container">
                <div className="title-mac-container" onMouseEnter={() => setIconHover(true)} onMouseLeave={() => setIconHover(false)}>
                    {iconHover ? <>
                    <CircleCloseIcon className="title-mac-button" color="var(--closeButton)" onClick={close}/>
                    <CircleMinimizeIcon className="title-mac-button" color="var(--minimizeButton)" onClick={minimize}/>
                    <CircleMaximizeIcon className="title-mac-button" color="var(--maximizeButton)" onClick={maximize}/>
                    </> : <>
                    <CircleIcon className="title-mac-button" color="var(--closeButton)" onClick={close}/>
                    <CircleIcon className="title-mac-button" color="var(--minimizeButton)" onClick={minimize}/>
                    <CircleIcon className="title-mac-button" color="var(--maximizeButton)" onClick={maximize}/>
                    </>}
                </div>
                <div className="title-container">
                    <Icon className="app-icon"/>
                    <span className="title">Pixel Compressor</span>
                </div>
                <div className="title-button-container">
                    <MP3Icon className="title-bar-button" onClick={mp3}/>
                    <VTTIcon className="title-bar-button" onClick={vtt}/>
                    <RenameIcon className="title-bar-button" onClick={rename}/>
                    <CoverIcon className="title-bar-button" onClick={cover}/>
                    <PDFIcon className="title-bar-button" onClick={pdf}/>
                    <FlattenIcon className="title-bar-button" onClick={flatten}/>
                    <TransparentIcon className="title-bar-button" onClick={switchTransparency}/>
                    <PinIcon className={`title-bar-button ${pinned && "title-button-active"}`} onClick={switchPinned}/>
                    {theme === "light" ?
                    <LightIcon className="title-bar-button" onClick={switchTheme}/> :
                    <DarkIcon className="title-bar-button" onClick={switchTheme}/>}
                    <MacIcon className="title-bar-button" onClick={switchOSStyle}/>
                </div>
            </div>
        )
    }

    const windowsTitleBar = () => {
        return (
            <>
            <div className="title-group-container">
                <div className="title-container">
                    <Icon className="app-icon"/>
                    <span className="title">Pixel Compressor</span>
                </div>
                <div className="title-button-container">
                    <MP3Icon className="title-bar-button" onClick={mp3}/>
                    <VTTIcon className="title-bar-button" onClick={vtt}/>
                    <RenameIcon className="title-bar-button" onClick={rename}/>
                    <CoverIcon className="title-bar-button" onClick={cover}/>
                    <PDFIcon className="title-bar-button" onClick={pdf}/>
                    <FlattenIcon className="title-bar-button" onClick={flatten}/>
                    <TransparentIcon className="title-bar-button" onClick={switchTransparency}/>
                    <PinIcon className={`title-bar-button ${pinned && "title-button-active"}`} onClick={switchPinned}/>
                    {theme === "light" ?
                    <LightIcon className="title-bar-button" onClick={switchTheme}/> :
                    <DarkIcon className="title-bar-button" onClick={switchTheme}/>}
                    <WindowsIcon className="title-bar-button" onClick={switchOSStyle}/>
                </div>
            </div>
            <div className="title-group-container">
                <div className="title-win-container">
                    <MinimizeIcon className="title-win-button" color="var(--minimizeButton)" onClick={minimize}/>
                    <MaximizeIcon className="title-win-button" color="var(--maximizeButton)" onClick={maximize} style={{marginLeft: "4px"}}/>
                    <CloseIcon className="title-win-button" color="var(--closeButton)" onClick={close}/>
                </div>
            </div>
            </>
        )
    }

    return (
        <section className="title-bar" onMouseDown={onMouseDown}>
                <div className="title-bar-drag-area">
                    {os === "mac" ? macTitleBar() : windowsTitleBar()}
                </div>
        </section>
    )
}

export default TitleBar
