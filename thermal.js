#!/usr/bin/env node
process.title = "i3blocks-js-thermal";

const { templates } = require("./conf.json");
const { formatText, execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

const mainJob = jobPlanner(async ({
    zone = 0,

    frmt = `T: %degree%°`,
    template = "normal",

    warning_trigger=55,
    warning_template = "warning",
    warning_frmt = frmt,

    alert_trigger=65,
    alert_template = "alert",
    alert_frmt = frmt,
}) => {
    const [, , temp] = await execAsync(`cat /sys/class/thermal/thermal_zone${zone}/temp`);
    const degree = temp.trim() / 1000;

    update(
        templates[
            degree < warning_trigger ? template :
            degree < alert_trigger ? warning_template :
            alert_template
        ],
        formatText(
            degree < warning_trigger ? frmt :
            degree < alert_trigger ? warning_frmt :
            alert_frmt,
            {degree}
        )
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

process.on('SIGUSR1', () => {
    mainJob.resume(true);
})