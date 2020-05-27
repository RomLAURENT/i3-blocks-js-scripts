#!/usr/bin/env node
const templates = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./blocks");

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
