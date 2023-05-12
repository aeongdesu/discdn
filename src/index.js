import "dotenv/config"
import express from "express"
import FileUpload from "express-fileupload"
import { FormData, fetch } from "undici"
import { Blob } from "node:buffer"
import { Deta } from "deta"
import { v4 as generateUuid } from "uuid"

const app = express()
app.use(express.json())
app.use(FileUpload())

const deta = new Deta(process.env.DETA_PROJECT_KEY)
const db = deta.Base("data")

app.get("/", async (req, res) => {
    if (!await db.get("_API_KEY")) {
        const dbkey = await db.put(generateUuid(), "_API_KEY")
        if (!dbkey?.value) return res.status(500)
        return res.send(`api key is: ${dbkey.value}\nyou can also see it in db`)
    }
    return res.sendStatus(200)
})

app.post("/file/upload", async (req, res) => {
    if (req.body["api_key"] !== (await db.get("_API_KEY"))?.value) return res.sendStatus(403)
    if (!req.files?.file) return res.sendStatus(400).send("No files were uploaded")
    const file = req.files.file
    if (file.size > 26214400) return res.sendStatus(413) // up to 25mb

    const code = generate()
    const form = new FormData()
    form.append("file", new Blob([file.data]), file.name)

    const webhook = await fetch(`${process.env.DISCORD_WEBHOOK}?wait=true${process.env.THREAD_ID ? `&thread_id=${process.env.THREAD_ID}` : ""}`, {
        method: "POST",
        body: form
    })
    if (!webhook.ok) return res.sendStatus(500)
    const json = await webhook.json()
    const uuid = generateUuid()

    await db.put({
        url: json.attachments[0].url,
        id: json.id,
        deleteCode: uuid
    }, code)

    return res.send({
        code: code,
        url: `https://${req.headers.host}/${code}`,
        discord_url: json.attachments[0].url,
        del_url: `https://${req.headers.host}/delete/${code}/${uuid}`
    })
})

app.get("/:code", async (req, res) => {
    const file = await db.get(req.params.code)
    if (!file) return res.sendStatus(404)
    return res.redirect(file.url)
})

app.get("/delete/:code/:uuid", async (req, res) => {
    const file = await db.get(req.params.code)
    if (!file) return res.sendStatus(404)
    if (file.deleteCode !== req.params.uuid) return res.sendStatus(403)

    const webhook = await fetch(`${process.env.DISCORD_WEBHOOK}/messages/${file.id}${process.env.THREAD_ID ? `?thread_id=${process.env.THREAD_ID}` : ""}`, { method: "DELETE" })
    if (!webhook.ok) return res.sendStatus(500)

    await db.delete(req.params.code)
    return res.sendStatus(200)
})

app.listen(process.env.PORT)

const generate = (length = 9) => {
    let result = ""
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
    return result
}