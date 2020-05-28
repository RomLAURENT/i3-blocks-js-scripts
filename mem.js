#!/usr/bin/env node
const { templates } = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

const mainJob = jobPlanner(async ({ symbol, zone, warning, alert }) => {

    const [, , mem] = await execAsync(`free | grep "Mem:"`);
    const [, total, used] = mem.trim().split(/\s+/);
    const usedPC = used / total * 100;

    const template =
        usedPC < alert ? templates.alert :
            usedPC < warning ? templates.warning :
                templates.normal;

    update(
        template,
        { full_text: `${symbol} <span size='small'>${Math.round(usedPC)}%</span>` }
    );
}, 1000);

eventHandler(async ({ button, left_click, wheel_click, right_click, wheel_up, wheel_down }) => {
    switch (button) {
        case 1:
            {
                if (left_click) await execAsync(left_click);
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