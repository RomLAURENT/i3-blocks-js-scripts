#!/usr/bin/env node
const templates = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./blocks");

let savedVolume = "0%";

async function getVolume(card, control) {
    const [, , svolume] = await execAsync(`amixer -c ${card} get ${control} | grep "Front Left:" | awk '{print $5}'`);
    const volume = svolume.trim().substring(1, svolume.trim().length - 1);
    const muted = volume === "0%"
    return [volume, muted];
}

const mainJob = jobPlanner(async ({ card, control, symbol, mutedsymbol }) => {
    const [volume, muted] = await getVolume(card, control);

    if (muted) {
        update(
            templates.alert,
            { full_text: mutedsymbol }
        );
    } else {
        savedVolume = volume;

        update(
            templates.normal,
            { full_text: `${symbol} <span size='small'>${volume.trim()}</span>` }
        );
    }
}, 5000);

eventHandler(async ({ card, control, button }) => {
    switch (button) {
        case 1:
            const [volume, muted] = await getVolume(card, control);
            const newVolume = muted ? savedVolume : `0%`;
            await execAsync(`amixer -c ${card} set ${control} ${newVolume}`);
            mainJob.resume(true);
            break;

        case 3:
            await execAsync(`i3-msg 'exec "xfce4-terminal -e \"alsamixer -c ${card}\""'`);
            mainJob.resume(true);
            break;

        case 4:
            await execAsync(`amixer -c ${card} set ${control} 5%+`);
            mainJob.resume(true);
            break;

        case 5:
            await execAsync(`amixer -c ${card} set ${control} 5%-`);
            mainJob.resume(true);
            break;
    }
});

process.on('SIGUSR1', () => {
    mainJob.resume(true);
});