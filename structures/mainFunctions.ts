import fs from "fs"
import path from "path"
import Sagiri from "sagiri"
import {translate} from "bing-translate-api"
import functions from "./functions"

export default class MainFunctions {
    public static translateTitle = async (title: string) => {
        if (!title) return ""
        try {
            const translated = await translate(title, "ja", "en")
            return translated.translation
        } catch {
            return title
        }
    }

    public static newDest = (dest: string, active: any[]) => {
        let duplicate = active.find((a) => a.dest === dest)
        let i = 1
        let newDest = dest
        while (fs.existsSync(newDest) || duplicate) {
            newDest = `${path.dirname(dest)}\\${path.basename(dest, path.extname(dest))}_${i}${path.extname(dest)}`
            duplicate = active.find((a) => a.dest === newDest)
            i++
        }
        return newDest
    }

    public static parseDest = async (source: string, dir: string, rename: string, format: string, width: number, height: number, overwrite: boolean) => {
        const sourceDir = path.dirname(source)
        const name = path.basename(source, path.extname(source))
        if (format === "original") format = path.extname(source).replaceAll(".", "")
        if (/{title}/i.test(rename) || /{id}/i.test(rename) || /{artist}/i.test(rename) || /{englishTitle}/i.test(rename)) {
            await functions.timeout(1000)
            try {
                const sagiri = Sagiri("93ccce3cc10aed8078633c67abe3e327dea87451")
                const results = await sagiri(source, {mask: [5]})
                const englishTitle = await MainFunctions.translateTitle(results[0].raw.data.title)
                rename = rename
                ?.replace(/{title}/gi, results[0].raw.data.title ?? "")
                .replace(/{englishTitle}/gi, englishTitle)
                .replace(/{id}/gi, results[0].raw.data.pixiv_id ?? "")
                .replace(/{artist}/gi, results[0].raw.data.member_name ?? "")
            } catch {
                rename = rename
                ?.replace(/{title}/gi, "")
                .replace(/{englishTitle}/gi, "")
                .replace(/{id}/gi, "")
                .replace(/{artist}/gi, "")
            }
        }
        rename = rename
        ?.replace(/{name}/gi, name)
        .replace(/{width}/gi, String(width))
        .replace(/{height}/gi, String(height))
        if (!rename) rename = name
        let dest = `${overwrite ? sourceDir : dir}/${rename}.${format}`
        if (!overwrite && fs.existsSync(dest)) {
            let i = 1
            while (fs.existsSync(dest)) {
                dest = `${overwrite ? sourceDir : dir}/${rename}_${i}.${format}`
                i++
            }
        }
        return dest
    }

    public static removeDirectory = (dir: string) => {
        if (dir === "/" || dir === "./") return
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach(function(entry) {
                const entryPath = path.join(dir, entry)
                if (fs.lstatSync(entryPath).isDirectory()) {
                    MainFunctions.removeDirectory(entryPath)
                } else {
                    fs.unlinkSync(entryPath)
                }
            })
            try {
                fs.rmdirSync(dir)
            } catch (e) {
                console.log(e)
            }
        }
    }
}