import React, {useEffect} from "react"
import {useThemeSelector, useThemeActions} from "./store"
import {Themes, OS} from "./reducers/themeReducer"

const lightColorList = {
	"--background": "#ffd5e2",
	"--navColor": "#ffa4c7",
	"--iconColor": "#ff579d",
	"--textColor": "#000000",
	"--maximizeButton": "#ff6bd0",
	"--minimizeButton": "#ff2ec0",
	"--closeButton": "#ff2e93",
	"--textboxColor": "#ffaaca",
	"--barColor": "#ffffff",
	"--clearAllButton": "#ff75b8",
	"--startAllButton": "#ff81b3",
	"--duplicatesButton": "#ff71b6",
	"--itemBG": "#ff95bf",
	"--itemStroke": "#ffadcf",
	"--finishedColor": "#80ffdd",
	"--arrowColor": "#ff478b",
	"--checkboxColor": "#e82382",
	"--stopButton": "#ff68a5",
	"--locationButton": "#ff65b5",
	"--trashButton": "#ff49aa",
	"--reductionColor": "#ffffff",
	"--textColor2": "#000000",
	"--titleColor": "#f94788"
}

const darkColorList = {
	"--background": "#271017",
	"--navColor": "#7c2552",
	"--iconColor": "#ff579d",
	"--textColor": "#ffffff",
	"--maximizeButton": "#ff6bd0",
	"--minimizeButton": "#ff2ec0",
	"--closeButton": "#ff2e93",
	"--textboxColor": "#742651",
	"--barColor": "#000000",
	"--clearAllButton": "#b34c75",
	"--startAllButton": "#b34c75",
	"--duplicatesButton": "#b93167",
	"--itemBG": "#712c48",
	"--itemStroke": "#64233e",
	"--finishedColor": "#63fdd4",
	"--arrowColor": "#ff478b",
	"--checkboxColor": "#e82382",
	"--stopButton": "#ac3f6a",
	"--locationButton": "#ff65b5",
	"--trashButton": "#ff49aa",
	"--reductionColor": "#ff63a6",
	"--textColor2": "#000000",
	"--titleColor": "#f97daa"
}

const LocalStorage: React.FunctionComponent = () => {
    const {theme, os} = useThemeSelector()
    const {setTheme, setOS} = useThemeActions()

    useEffect(() => {
        if (typeof window === "undefined") return
        const colorList = theme.includes("light") ? lightColorList : darkColorList
        for (let i = 0; i < Object.keys(colorList).length; i++) {
            const key = Object.keys(colorList)[i]
            const color = Object.values(colorList)[i]
            document.documentElement.style.setProperty(key, color)
        }
    }, [theme])

    useEffect(() => {
        const initTheme = async () => {
            const savedTheme = await window.ipcRenderer.invoke("get-theme")
            if (savedTheme) setTheme(savedTheme as Themes)
        }
        initTheme()
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
        window.ipcRenderer.invoke("save-os", os)
    }, [os])

    return null
}

export default LocalStorage