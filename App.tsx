import "bootstrap/dist/css/bootstrap.min.css"
import React, { useEffect } from "react"
import {createRoot} from "react-dom/client"
import {Provider} from "react-redux"
import store from "./store"
import TitleBar from "./components/TitleBar"
import LogoBar from "./components/LogoBar"
import FileSelector from "./components/FileSelector"
import DirectoryBar from "./components/DirectoryBar"
import OptionsBar from "./components/OptionsBar"
import GroupAction from "./components/GroupAction"
import FileContainerList from "./components/FileContainerList"
import ContextMenu from "./components/ContextMenu"
import LocalStorage from "./LocalStorage"
import "./index.less"

const App = () => {
  return (
    <main className="app">
        <TitleBar/>
        <ContextMenu/>
        <LocalStorage/>
        <LogoBar/>
        <FileSelector/>
        <DirectoryBar/>
        <OptionsBar/>
        <GroupAction/>
        <FileContainerList/>
    </main>
  )
}

const root = createRoot(document.getElementById("root")!)
root.render(<Provider store={store}><App/></Provider>)
