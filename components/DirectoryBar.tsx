import React, {useEffect, useState} from "react"
import {useCompressSelector, useCompressActions} from "../store"
import FolderIcon from "../assets/svg/folder.svg"
import SourceIcon from "../assets/svg/source.svg"
import functions from "../structures/functions"
import "./styles/directorybar.less"

const DirectoryBar: React.FunctionComponent = () => {
    const {directory} = useCompressSelector()
    const {setDirectory} = useCompressActions()
    const [source, setSource] = useState(false)

    useEffect(() => {
        window.ipcRenderer.invoke("get-downloads-folder").then((f) => {
            f = f.replace(/\\/g, "/")
            if (!f.endsWith("/")) f = `${f}/`
            setDirectory(f)
            setSource(false)
        })
    }, [])

    const changeDirectory = async () => {
        let dir = await window.ipcRenderer.invoke("select-directory")
        if (dir) {
            dir = dir.replace(/\\/g, "/")
            if (!dir.endsWith("/")) dir = `${dir}/`
            setDirectory(dir)
            setSource(false)
        }
    }

    const updateDirectory = (event: React.ChangeEvent<HTMLInputElement>) => {
        const dir = event.target.value.replace(/\\/g, "/")
        setDirectory(dir)
        window.ipcRenderer.invoke("select-directory", dir)
    }

    const openDirectory = () => {
        if (source) return
        const dir = functions.escape(directory)
        window.ipcRenderer.invoke("open-location", dir, true)
    }

    const sourceAction = () => {
        if (source) {
            window.ipcRenderer.invoke("get-downloads-folder", true).then((f) => {
                f = f.replace(/\\/g, "/")
                if (!f.endsWith("/")) f = `${f}/`
                setDirectory(f)
                setSource(false)
                window.ipcRenderer.invoke("select-directory", f)
            })
        } else {
            setSource(true)
            setDirectory("{source}/")
            window.ipcRenderer.invoke("select-directory", "{source}/")
        }
    }

    return (
        <section className="directory-bar">
            <div className="directory-bar-center">
                <SourceIcon className="directory-bar-img" onClick={sourceAction}/>
                <FolderIcon className="directory-bar-img" onClick={changeDirectory}/>
                <input className="directory-bar-box" type="text" value={directory} onDoubleClick={openDirectory} onChange={updateDirectory}/>
            </div>
        </section>
    )
}

export default DirectoryBar