
const cheerio = require("cheerio");
// const request = require("request");s
const axios = require("axios");
const fs = require("fs");

const plays = [
    // {
    //     title: "asyoulikeit",
    //     actScenes: [3, 7, 5, 3, 4]
    // },
    // {
    //     title: "merchant",
    //     actScenes: [3, 9, 5, 2, 1]
    // },
    // {
    //     title: "coriolanus",
    //     actScenes: [10, 3, 3, 7, 6]
    // },
    // {
    //     title: "1henryiv",
    //     actScenes: [3, 4, 2, 4, 5]
    // },
    // {
    //     title: "hamlet",
    //     actScenes: [5, 2, 4, 7, 2]
    // },
    // {
    //     title: "macbeth",
    //     actScenes: [7, 4, 6, 3, 8]
    // }
    {
        title: "measure",
        actScenes: [4, 4, 2, 6, 1]
    },
    {
        title: "midsummer",
        actScenes: [2, 2, 2, 2, 1]
    },
    {
        title: "much_ado",
        actScenes: [3, 3, 5, 2, 4]
    }, {
        title: "tempest",
        actScenes: [2, 2, 3, 1, 1]
    }, {
        title: "troilus_cressida",
        actScenes: [3, 3, 3, 5, 10]
    },
    {
        title: "twelfth_night",
        actScenes: [5, 5, 4, 3, 1]
    }
];

async function getText(play) {
    const baseUrl = "http://shakespeare.mit.edu";
    const urls = [];

    // Generate urls (no need for titles -- also just use map):
    play.actScenes.forEach((numScenes, actIdx) => {
        for (let i = 0; i < numScenes; i++) {
            const sceneTitle = `${actIdx + 1}.${i + 1}`;
            const url = `${baseUrl}/${play.title}/${play.title}.${sceneTitle}.html`;
            urls.push({ url, title: sceneTitle });
        }
    });

    const scenes = [];

    const responses = await axios.all(urls.map(url => axios.get(url.url)));

    responses.forEach(r => {
        // console.log("r", r.config.url);
        const url = r.config.url;
        const i1 = url.lastIndexOf(play.title);
        const i2 = url.indexOf(".html");
        const sceneTitle = url.slice(i1 + play.title.length + 1, i2);

        const scene = {
            title: sceneTitle,
            play: play.title,
            lines: []
        };

        const $ = cheerio.load(r.data);

        let speaker = "";

        $("a").each((i, el) => {
            // NOTE this misses the intro text to each scene,
            // and presumably any stage directions along the way

            let text = "";
            let type = "text";
            const name = el.attribs?.name;
            if (!name) return;

            if (name.includes("speech")) {
                text = $(el).find("b").text();
                type = "speech";
                speaker = text;
            } else {
                //  text = el.children[0]?.data;
                text = $(el).text();
            }
            // console.log("el", name, text);
            scene.lines.push({ type, value: text, speaker });
        });

        // plays.find(p => p.title === play.title).scenes.push(scene);
        scenes.push(scene);
    });

    return scenes;
}

async function run() {
    try {
        const allPlays = await Promise.all(plays.map(p => getText(p)));
        // console.log('data', allPlays);

        allPlays.forEach(play => {
            const file = JSON.stringify(play);
            const playTitle = play[0].play;
            console.log("writing....", playTitle);
            // const speakers = getLinesBySpeaker(play);
            // console.log("speakers", speakers);
            fs.writeFileSync(`public/assets/${playTitle}.json`, file);
        });

    } catch (e) {
        console.error("e", e);
    }
}


// D3 RIDGE PLOT!
// https://bl.ocks.org/armollica/3b5f83836c1de5cca7b1d35409a013e3

function getLinesBySpeaker(scenes) {
    const speakers = {};

    scenes.forEach(scene => {
        scene.lines.forEach(line => {
            if (line.type === "text") {
                if (!speakers.hasOwnProperty(line.speaker)) {
                    speakers[line.speaker] = 0;
                }
                speakers[line.speaker]++;
            }
        });
    });

    return speakers;
}

run();
// console.log("scene 1", scenes[0].title, scenes[0].lines);



/*

Basic idea: (rap)Genius, but better

So....we'll need a database..

- Select a chunk oof text; keypress to do a specificc actiono
- Add words to tags, like "sad" or "duty-based", so ccan highlight all in same color
- Filter by speaker; show alll their lines, spaced out by scene
(does this mean we should store as chunks?)
- add charactere relational maps somehow
- graphs of number of linse per speaker per scene (3d??? with each succeessive speaker line receding into bg?)
- oor d3?





*/