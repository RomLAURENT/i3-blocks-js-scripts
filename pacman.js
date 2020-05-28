#!/usr/bin/env node
const { templates } = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

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

eventHandler(async ({ button, wheel_click, right_click, wheel_up, wheel_down }) => {
    switch (button) {
        case 1:
            {
                mainJob.resume(true);
            }
            break;

        case 2:
            {
                if (wheel_click) await execAsync(wheel_click);
            }
            break;

        case 3:
            {
                if (right_click) await execAsync(right_click);
            }
            break;

        case 4:
            {
                if (wheel_up) await execAsync(wheel_up);
            }
            break;

        case 5:
            {
                if (wheel_down) await execAsync(wheel_down);
            }
            break;
    }
});
