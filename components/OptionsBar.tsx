/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pixel Compressor - A cute image compressor ❤              *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import {Dropdown, DropdownButton} from "react-bootstrap"
import CheckboxIcon from "../assets/svg/checkbox.svg"
import CheckboxCheckedIcon from "../assets/svg/checkbox-checked.svg"
import {useCompressSelector, useCompressActions} from "../store"
import Slider from "rc-slider"
import "./styles/optionsbar.less"

const OptionsBar: React.FunctionComponent = () => {
    const {quality, ignoreBelow, resizeWidth, resizeHeight,
        percentage, keepRatio, rename, format, progressive, directory
    } = useCompressSelector()
    const {setQuality, setIgnoreBelow, setResizeWidth, setResizeHeight,
        setPercentage, setKeepRatio, setRename, setFormat, setProgressive
    } = useCompressActions()

    useEffect(() => {
        initSettings()
    }, [])

    useEffect(() => {
        window.ipcRenderer.invoke("store-settings", {quality, directory, ignoreBelow, resizeWidth, 
        resizeHeight, percentage, keepRatio, rename, format, progressive})
    }, [quality, directory, ignoreBelow, resizeWidth, resizeHeight, 
        percentage, keepRatio, rename, format, progressive])
    
    const initSettings = async () => {
        const settings = await window.ipcRenderer.invoke("init-settings")
        if (settings) {
            setQuality(settings.quality)
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

    return (
        <section className="options-bar-container">
            <div className="options-bar">
                <div className="options-bar-row">
                    <div className="options-bar-box">
                        <p className="options-bar-text">Quality:</p>
                        <Slider className="options-slider" onChange={(value) => setQuality(value as number)} min={1} max={100} step={1} value={quality}/>
                        <p className="options-bar-text" style={{width: "50px"}}>{quality}%</p>
                    </div>
                    <div className="options-bar-box">
                        <p className="options-bar-text">Ignore Under:</p>
                        <input className="options-bar-input wide" type="text" value={ignoreBelow} onChange={handleIgnoreBelow}/>
                    </div>
                </div>
                <div className="options-bar-row">
                    <div className="options-bar-box">
                        {percentage ?
                        <CheckboxCheckedIcon className="options-bar-checkbox" onClick={() => setPercentage(!percentage)}/> :
                        <CheckboxIcon className="options-bar-checkbox" onClick={() => setPercentage(!percentage)}/>}
                        <p className="options-bar-text pointer" onClick={() => setPercentage(!percentage)}>Percentage</p>
                    </div>
                    <div className="options-bar-box">
                        {keepRatio ?
                        <CheckboxCheckedIcon className="options-bar-checkbox" onClick={() => setKeepRatio(!keepRatio)}/> :
                        <CheckboxIcon className="options-bar-checkbox" onClick={() => setKeepRatio(!keepRatio)}/>}
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
                        {progressive ?
                        <CheckboxCheckedIcon className="options-bar-checkbox" onClick={() => setProgressive(!progressive)}/> :
                        <CheckboxIcon className="options-bar-checkbox" onClick={() => setProgressive(!progressive)}/>}
                        <p className="options-bar-text pointer" onClick={() => setProgressive(!progressive)}>Progressive</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default OptionsBar