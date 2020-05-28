#!/usr/bin/env node
const { templates } = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

const mainJob = jobPlanner(async ({ symbol, zone, warning, alert }) => {

    const [, , idle] = await execAsync(`mpstat 1 1 | grep 'Moyenne' | awk '{print $12}'`);
    const usage = 100 - idle.trim().split(",")[0];

    const template =
        usage < warning ? templates.normal :
            usage < alert ? templates.warning :
                templates.alert;

    update(
        template,
        {
            full_text: `${symbol} <span size='small'>${usage}%</span>`,
        }
    );
}, 10);


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