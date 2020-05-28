#!/usr/bin/env node
const { templates } = require("./conf.json");
const { formatText, execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

let savedVolume = "0%";

async function getVolume(card, control) {
    const [, , svolume] = await execAsync(`amixer -c ${card} get ${control} | grep "Front Left:" | awk '{print $5}'`);
    const volume = Number(svolume.trim().substring(1, svolume.trim().length - 2));
    const muted = volume === 0;
    return [volume, muted];
}

const mainJob = jobPlanner(async ({
    card,
    control,

    frmt = "%control%: <span size='small'>%volume%%</span>",
    template = "normal",

    muted_frmt = "%control%: <span size='small'>%volume%%</span>",
    muted_template = "alert"
}) => {
    const [volume, muted] = await getVolume(card, control);

    if (!muted) savedVolume = volume;

    update(
        templates[muted ? muted_template : template],
        formatText(muted ? muted_frmt : frmt, { volume, control })
    );
}, 5000);

eventHandler(async ({ card, control, button, wheelclick, rightclick }) => {
    switch (button) {
        case 1:
            {
                const [volume, muted] = await getVolume(card, control);
                const newVolume = muted ? savedVolume : 0;
                await execAsync(`amixer -c ${card} set ${control} ${newVolume}%`);
                mainJob.resume(true);
            }
            break;

        case 2:
            {
                if (wheelclick) await execAsync(wheelclick);
            }
            break;

        case 3:
            {
                if (rightclick) await execAsync(rightclick);
            }
            break;

        case 4:
            {
                await execAsync(`amixer -c ${card} set ${control} 5%+`);
                mainJob.resume(true);
            }
            break;

        case 5:
            {
                await execAsync(`amixer -c ${card} set ${control} 5%-`);
                mainJob.resume(true);
            }
            break;
    }
});

process.on('SIGUSR1', () => {
    mainJob.resume(true);
});