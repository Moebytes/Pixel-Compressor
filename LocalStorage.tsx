import React, {useEffect} from "react"
import {useThemeSelector, useThemeActions} from "./store"
import {Themes, OS} from "./reducers/themeReducer"

export const lightColorList = {
	"--background": "#ffd5e2",
	"--navColor": "#ffa4c7",
	"--iconColor": "#ff579d",
	"--textColor": "#000000",
	"--maximizeButton": "#ff6bd0",
	"--minimizeButton": "#ff2ec0",
	"--closeButton": "#ff2e93",
	"--selectorColor": "#ffa4c7",
	"--textboxColor": "#ffaaca",
	"--barColor": "#ffffff",
	"--clearAllButton": "#ff75b8",
	"--startAllButton": "#ff81b3",
	"--duplicatesButton": "#ff71b6",
	"--itemBG": "#ff95bf",
	"--itemStroke": "#ffadcf",
	"--finishedColor": "#80ffdd",
	"--arrowColor": "#ff478b",
	"--checkboxColor": "#FF45B5",
	"--stopButton": "#ff68a5",
	"--locationButton": "#ff65b5",
	"--trashButton": "#ff49aa",
	"--reductionColor": "#ffffff",
	"--textColor2": "#000000",
	"--titleColor": "#f94788",
	"--previewBG": "#ffffff",
    "--previewBG2": "#f8f8f8"
}

export const darkColorList = {
	"--background": "#271017",
	"--navColor": "#7c2552",
	"--iconColor": "#ff579d",
	"--textColor": "#ffffff",
	"--maximizeButton": "#ff6bd0",
	"--minimizeButton": "#ff2ec0",
	"--closeButton": "#ff2e93",
	"--selectorColor": "#7c2552",
	"--textboxColor": "#742651",
	"--barColor": "#000000",
	"--clearAllButton": "#b34c75",
	"--startAllButton": "#b34c75",
	"--duplicatesButton": "#b93167",
	"--itemBG": "#712c48",
	"--itemStroke": "#64233e",
	"--finishedColor": "#63fdd4",
	"--arrowColor": "#ff478b",
	"--checkboxColor": "#FF45B5",
	"--stopButton": "#ac3f6a",
	"--locationButton": "#ff65b5",
	"--trashButton": "#ff49aa",
	"--reductionColor": "#ff63a6",
	"--textColor2": "#000000",
	"--titleColor": "#f97daa",
	"--previewBG": "#131313",
    "--previewBG2": "#181818"
}

const LocalStorage: React.FunctionComponent = () => {
    const {theme, os, transparent, pinned} = useThemeSelector()
    const {setTheme, setOS, setTransparent, setPinned} = useThemeActions()

    useEffect(() => {
        if (typeof window === "undefined") return
        const colorList = theme.includes("light") ? lightColorList : darkColorList
        
        for (let i = 0; i < Object.keys(colorList).length; i++) {
            const key = Object.keys(colorList)[i]
            const color = Object.values(colorList)[i]
            document.documentElement.style.setProperty(key, color)
        }

        if (transparent) {
            document.documentElement.style.setProperty("--background", "transparent")
            document.documentElement.style.setProperty("--navColor", "transparent")
        }
    }, [theme, transparent])

    useEffect(() => {
        const initTheme = async () => {
            const savedTheme = await window.ipcRenderer.invoke("get-theme")
            if (savedTheme) setTheme(savedTheme as Themes)
        }
        const updateTheme = (event: any, theme: string, transparent: boolean, os: OS) => {
            setOS(os)
        }
        initTheme()
        window.ipcRenderer.on("update-theme", updateTheme)
        return () => {
            window.ipcRenderer.removeListener("update-theme", updateTheme)
        }
    }, [])

    useEffect(() => {
        window.ipcRenderer.invoke("save-theme", theme)
    }, [theme])


    useEffect(() => {
        const initOS = async () => {
            const savedOS = await window.ipcRenderer.invoke("get-os")
            if (savedOS) setOS(savedOS as OS)
        }
        initOS()
    }, [])

	useEffect(() => {
        const initTransparent = async () => {
            const savedTransparent = await window.ipcRenderer.invoke("get-transparent")
            if (savedTransparent) setTransparent(savedTransparent)
        }
        initTransparent()
    }, [])

    useEffect(() => {
        window.ipcRenderer.invoke("save-transparent", transparent)
    }, [transparent])

    useEffect(() => {
        const initPinned = async () => {
            const savedPinned = await window.ipcRenderer.invoke("get-pinned")
            if (savedPinned) setPinned(savedPinned)
        }
        initPinned()
    }, [])

    useEffect(() => {
        window.ipcRenderer.invoke("save-pinned", pinned)
    }, [pinned])

    return null
}

export default LocalStorage