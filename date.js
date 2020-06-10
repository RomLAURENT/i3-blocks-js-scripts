#!/usr/bin/env node
process.title = "i3blocks-js-date";

const { templates } = require("./conf.json");
const { formatText, execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

const { format } = require("date-fns");
const locales = require('date-fns/locale');

const confs = [];

for (let i = 0; process.env[`frmt_${i}`] || process.env[`pattern_${i}`] || process.env[`template_${i}`]; i++) {
    confs.push({
        frmt: process.env[`frmt_${i}`] || process.env.default_frmt || `%date%`,
        pattern: process.env[`pattern_${i}`] || process.env.default_pattern || `PPPPpppp`,
        template: process.env[`template_${i}`] || process.env.default_template || `normal`,
    });
}

if(!confs.length){
    confs.push({
        frmt: process.env.default_frmt || `%date%`,
        pattern: process.env.default_pattern || `PPPPpppp`,
        template: process.env.default_template || `normal`,
    });
}

const mainJob = jobPlanner(async ({ locale = "fr" }) => {
    const { frmt, pattern, template } = confs[0];
    update(
        template,
        formatText(
            frmt,
            { date: format(new Date(), pattern, { locale: locales[locale] }) }
        )
    );
}, 100);

eventHandler(async ({ button, wheel_click, right_click, wheel_up, wheel_down }) => {
    switch (button) {
        case 1:
            {
                confs.push(confs.shift());
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