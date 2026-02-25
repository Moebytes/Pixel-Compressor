import React from "react"
import {useActionSelector} from "../store"
import "./styles/groupaction.less"

const GroupAction: React.FunctionComponent = (props) => {
    const {clearAll} = useActionSelector()

    const start = () => {
        window.ipcRenderer.invoke("start-all")
    }

    const clear = () => {
        window.ipcRenderer.invoke("clear-all")
    }

    const deleteDupes = () => {
        window.ipcRenderer.invoke("delete-duplicates")
    }

    if (clearAll) {
        return (
            <section className="group-action-container">
                <button className="group-action-button" onClick={start} style={{backgroundColor: "var(--startAllButton)"}}>{">>Start All"}</button>
                <button className="group-action-button" onClick={clear} style={{backgroundColor: "var(--clearAllButton)"}}>{">>Clear All"}</button>
                <button className="group-action-button" onClick={deleteDupes} style={{backgroundColor: "var(--duplicatesButton)"}}>{">>Delete Duplicates"}</button>
            </section>
        )
    }
    return null
}

export default GroupAction