#!/usr/bin/env node
const { templates } = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./blocks");

const mainJob = jobPlanner(async ({ symbol, locale = "fr" }) => {
    update(
        templates.warning,
        { full_text: `${symbol} ` }
    );

    const [, , updates = 0] = await execAsync(`pamac checkupdates -aq | wc -l`);
    const template = updates.trim() == 0 ? templates.good : templates.warning;

    update(
        template,
        {
            full_text: `${symbol} <span size='small'>${updates.trim()}</span>`,
        }
    );
}, 3 * 60 * 60 * 1000);

eventHandler(async ({ button, symbol }) => {
    switch (button) {
        case 1:
            await execAsync(`i3-msg 'exec "pamac-manager --updates"'`);
            break;

        case 3:
            mainJob.resume(true);
            break;
    }
});
