#!/usr/bin/env node
const templates = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./blocks");

async function getRemaining() {
    const [, , remaining_res] = await execAsync(`cat /sys/class/power_supply/BAT1/capacity`);
    const remaining = remaining_res.trim();
    return remaining;
}

async function isCharging() {
    const [, , status_res] = await execAsync(`cat /sys/class/power_supply/BAT1/status`);
    return status_res.trim() === 'Charging';
}

const mainJob = jobPlanner(async ({ symbol_charging, symbol_discharging }) => {
    const remaining_value = await getRemaining();
    const is_charging = await isCharging();
    const symbol = is_charging ? symbol_charging : symbol_discharging;
    const remaining_label = ` <span size='small'>${remaining_value}%</span>`
    update(
        templates.normal,
        {
            full_text: `${symbol}${remaining_label}`,
        }
    );
}, 5000);