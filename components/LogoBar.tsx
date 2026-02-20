import React from "react"
import logo from "../assets/icons/logo.png"
import "./styles/logobar.less"

const LogoBar: React.FunctionComponent = () => {
    return (
        <section className="logo-bar">
            <div className="logo-bar-container">
                <img src={logo} className="logo" width="418" height="118"/>
                <div className="logo-bar-drag"></div>
            </div>
        </section>
    )
}

export default LogoBar
