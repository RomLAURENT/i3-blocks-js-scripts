#!/usr/bin/env node
const { templates } = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./blocks");

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
