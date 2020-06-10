#!/usr/bin/env node
process.title = "i3blocks-js-pacman";

const { templates } = require("./conf.json");
const { formatText, execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

const mainJob = jobPlanner(async ({ 
    frmt_checking = `PKG: CHK`,
    template_checking = `warning`,

    frmt_OK = `PKG: OK`,
    template_OK = `normal`,

    frmt_KO = `PKG: %count%`,
    template_KO = `alert`,
}) => {
    update(
        templates[template_checking],
        formatText(frmt_checking, {}),
    );

    const [, , updates = 0] = await execAsync(`pamac checkupdates -aq | wc -l`);
    const count = Number(updates.trim());

    update(
        templates[count ? template_KO : template_OK],
        formatText(count ? frmt_KO : frmt_OK, { count }),
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

process.on('SIGUSR1', () => {
    mainJob.resume(true);
});