#!/usr/bin/env node
const { templates } = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./blocks");

const mainJob = jobPlanner(async ({ symbol, zone, warning, alert }) => {
    const [, , temp] = await execAsync(`cat /sys/class/thermal/thermal_zone${zone}/temp`);
    const degree = temp.trim() / 1000;
    const template =
        degree < warning ? templates.normal :
            degree < alert ? templates.warning :
                templates.alert;

    update(
        template,
        {
            full_text: `${symbol} <span size='small'>${degree}°</span>`,
        }
    );
}, 1000);
