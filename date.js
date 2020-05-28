#!/usr/bin/env node
const { templates } = require("./conf.json");
const { formatText, execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

const { format } = require("date-fns");
const locales = require('date-fns/locale');

const patterns = [process.env.pattern, process.env.alt_pattern].filter(i => !!i);
const tmplts = [process.env.template, process.env.alt_template].filter(i => !!i);
const frmts = [process.env.frmt, process.env.alt_frmt].filter(i => !!i);

const mainJob = jobPlanner(async ({ locale = "fr" }) => {
    update(
        templates[tmplts[0]],
        formatText(
            frmts[0],
            { date: format(new Date(), patterns[0], { locale: locales[locale] }) }
        )
    );
}, 10);

eventHandler(async ({ button, wheel_click, right_click, wheel_up, wheel_down }) => {
    switch (button) {
        case 1:
            {
                patterns.push(patterns.shift());
                tmplts.push(tmplts.shift());
                frmts.push(frmts.shift());
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
