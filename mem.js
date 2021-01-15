#!/usr/bin/env node
process.title = "i3blocks-js-mem";

const { templates } = require("./conf.json");
const { formatText, execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

const mainJob = jobPlanner(async ({
    frmt = `MEM: %usedPc%%`,
    template = "normal",

    trigger_value="usedPc",

    warning_trigger=80,
    warning_template = "warning",
    warning_frmt = frmt,

    alert_trigger=90,
    alert_template = "alert",
    alert_frmt = frmt,
}) => {
    const [, , mem] = await execAsync(`free | grep "Mem:"`);
    const [, total, used, free, shared, cache, avaible] = mem.trim().split(/\s+/);
    const [usedPc, freePc, sharedPc, cachePc, avaiblePc] = [used, free, shared, cache, avaible].map(v => Math.round(v / total * 100));

    const values ={
        total,
        used, free, shared, cache, avaible,
        usedPc, freePc, sharedPc, cachePc, avaiblePc
    };

    const value = values[trigger_value];

    let tmplt;
    let text;
    if(warning_trigger > alert_trigger){
        tmplt = templates[
            value > warning_trigger ? template :
            value > alert_trigger ? warning_template :
            alert_template
        ];

        text = formatText(
            value > warning_trigger ? frmt :
            value > alert_trigger ? warning_frmt :
            alert_frmt,
            values
        );
    } else {
        tmplt = templates[
            value < warning_trigger ? template :
            value < alert_trigger ? warning_template :
            alert_template
        ];

        text = formatText(
            value < warning_trigger ? frmt :
            value < alert_trigger ? warning_frmt :
            alert_frmt,
            values
        );
    }

    update(tmplt, text);
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

process.on('SIGUSR1', () => {
    mainJob.resume(true);
});