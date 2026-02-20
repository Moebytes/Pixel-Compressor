import "bootstrap/dist/css/bootstrap.min.css"
import React from "react"
import {useDropzone} from "react-dropzone"
import {createRoot} from "react-dom/client"
import {Provider} from "react-redux"
import store from "./store"
import LogoBar from "./components/LogoBar"
import TitleBar from "./components/TitleBar"
import OptionsBar from "./components/OptionsBar"
import GroupAction from "./components/GroupAction"
import FileContainerList from "./components/FileContainerList"
import LocalStorage from "./LocalStorage"
import "./index.less"

const App = () => {
  const onDrop = (files: any) => {
    files = files.map((f: any) => f.path)
    window.ipcRenderer.invoke("on-drop", files)
  }

  const {getRootProps} = useDropzone({onDrop})

  return (
    <main className="app" {...getRootProps()}>
        <TitleBar/>
        <LocalStorage/>
        <LogoBar/>
        <OptionsBar/>
        <GroupAction/>
        <FileContainerList/>
    </main>
  )
}

const root = createRoot(document.getElementById("root")!)
root.render(<Provider store={store}><App/></Provider>)
