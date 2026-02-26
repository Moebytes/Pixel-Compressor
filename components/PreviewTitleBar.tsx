import React, {useState} from "react"
import {useThemeSelector, useThemeActions} from "../store"
import CircleIcon from "../assets/svg/circle.svg"
import CircleCloseIcon from "../assets/svg/circle-close.svg"
import CircleMinimizeIcon from "../assets/svg/circle-minimize.svg"
import CircleMaximizeIcon from "../assets/svg/circle-maximize.svg"
import CloseIcon from "../assets/svg/close.svg"
import MinimizeIcon from "../assets/svg/minimize.svg"
import MaximizeIcon from "../assets/svg/maximize.svg"
import ZoomInIcon from "../assets/svg/zoom-in.svg"
import ZoomOutIcon from "../assets/svg/zoom-out.svg"
import WindowsIcon from "../assets/svg/windows.svg"
import MacIcon from "../assets/svg/mac.svg"
import "./styles/previewtitlebar.less"

interface PreviewTitleBarProps {
    title: string
}

const PreviewTitleBar: React.FunctionComponent<PreviewTitleBarProps> = (props: PreviewTitleBarProps) => {
    const {os} = useThemeSelector()
    const {setOS} = useThemeActions()
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

    const zoomOut = () => {
        window.ipcRenderer.invoke("zoom-out")
    }

    const zoomIn = () => {
        window.ipcRenderer.invoke("zoom-in")
    }

    const switchOSStyle = () => {
        setOS(os === "mac" ? "windows" : "mac")
        window.ipcRenderer.invoke("save-os", os === "mac" ? "windows" : "mac")
    }

    const macTitleBar = () => {
        return (
            <div className="title-group-container">
                <div className="title-mac-container" onMouseEnter={() => setIconHover(true)} onMouseLeave={() => setIconHover(false)}>
                    {iconHover ? <>
                    <CircleCloseIcon className="title-mac-button" color="var(--macCloseButton)" onClick={close}/>
                    <CircleMinimizeIcon className="title-mac-button" color="var(--macMinimizeButton)" onClick={minimize}/>
                    <CircleMaximizeIcon className="title-mac-button" color="var(--macMaximizeButton)" onClick={maximize}/>
                    </> : <>
                    <CircleIcon className="title-mac-button" color="var(--macCloseButton)" onClick={close}/>
                    <CircleIcon className="title-mac-button" color="var(--macMinimizeButton)" onClick={minimize}/>
                    <CircleIcon className="title-mac-button" color="var(--macMaximizeButton)" onClick={maximize}/>
                    </>}
                </div>
                <div className="title-button-container">
                    <ZoomOutIcon className="title-bar-button" onClick={zoomOut}/>
                    <ZoomInIcon className="title-bar-button" onClick={zoomIn}/>
                    <MacIcon className="title-bar-button" onClick={switchOSStyle}/>
                </div>
            </div>
        )
    }

    const windowsTitleBar = () => {
        return (
            <>
            <div className="title-group-container">
                <div className="title-button-container">
                    <ZoomOutIcon className="title-bar-button" onClick={zoomOut}/>
                    <ZoomInIcon className="title-bar-button" onClick={zoomIn}/>
                    <WindowsIcon className="title-bar-button" onClick={switchOSStyle}/>
                </div>
            </div>
            <div className="title-group-container">
                <div className="title-win-container">
                    <MinimizeIcon className="title-win-button" onClick={minimize}/>
                    <MaximizeIcon className="title-win-button" onClick={maximize} style={{marginLeft: "4px"}}/>
                    <CloseIcon className="title-win-button" onClick={close}/>
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

export default PreviewTitleBar