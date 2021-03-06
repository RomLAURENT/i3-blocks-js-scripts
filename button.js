#!/usr/bin/env node
process.title = "i3blocks-js-button";

const { templates } = require("./conf.json");
const { formatText, execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

const mainJob = jobPlanner(async ({
    text,
    template="accent"
}) => {
    update(
        templates[template],
        text,
    );
}, 60 * 60 * 60 * 1000);

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