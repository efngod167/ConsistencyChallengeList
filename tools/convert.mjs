import fs from "node:fs"

const data_dir = "../data"

let list_text = JSON.parse(fs.readFileSync(`${data_dir}/_list.json`).toString())
let list = []


for (let level of list_text) {
    let leveldata = JSON.parse(fs.readFileSync(`${data_dir}/${level}.json`).toString())
    list.push(leveldata)
}

console.log(list.length)

let packlevels_text = fs.readFileSync("levels").toString().split("\n")
// let packlevels = JSON.parse(fs.readFileSync("packs.json").toString())
let packlevels = []

let index = 0;
let istitle = true;
for (let title of packlevels_text) {
    title = title.trimEnd()

    if (title.length <= 1) {
        istitle = !istitle
        continue
    }

    if (istitle) {
        index = packlevels.push({
            "name": title,
            "levels": [],
        }) - 1
        console.log(`reading ${title}...`);
        
    }
    else {
        let level = list.find((val) => val.name == title)
        if (level == undefined) {
            console.log(`couldn't find "${title}"`)
            // packlevels[i].levels.push(level_name)
        }
        else {
            packlevels[index].levels.push(level.id)
        }
    }
}

fs.writeFileSync(`${data_dir}/_packs.json`, JSON.stringify(packlevels))