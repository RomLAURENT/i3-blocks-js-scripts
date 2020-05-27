#!/usr/bin/env node
const templates = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./blocks");


const mainJob = jobPlanner(async ({ mode, dev, symbol, mutedsymbol }) => {
    const [, , volume] = await execAsync(`pamixer --${mode} ${dev} --allow-boost --get-volume-human`);

    if (volume.trim() === "muted") {
        update(
            templates.alert,
            { full_text: mutedsymbol }
        );
    }
    else {
        update(
            templates.normal,
            { full_text: `${symbol} <span size='small'>${volume.trim()}</span>` }
        );
    }
}, 500);

eventHandler(async ({ mode, dev, button }) => {
    switch (button) {
        case 1:
            await execAsync(`pamixer --${mode} ${dev} --allow-boost --toggle-mute`);
            mainJob.resume(true);
            break;

        case 3:
            await execAsync(`i3-msg 'exec "pavucontrol"'`);
            mainJob.resume(true);
            break;

        case 4:
            await execAsync(`pamixer --${mode} ${dev} --allow-boost --increase 5`);
            mainJob.resume(true);
            break;

        case 5:
            await execAsync(`pamixer --${mode} ${dev} --allow-boost --decrease 5`);
            mainJob.resume(true);
            break;
    }
});

process.on('SIGUSR1', () => {
    mainJob.resume(true);
})