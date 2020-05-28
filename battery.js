#!/usr/bin/env node
const {templates} = require("./conf.json");
const { formatText, execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

async function getRemaining() {
    const [, , remaining_res] = await execAsync(`cat /sys/class/power_supply/BAT1/capacity`);
    const remaining = remaining_res.trim();
    return remaining;
}

async function isCharging() {
    const [, , status_res] = await execAsync(`cat /sys/class/power_supply/BAT1/status`);
    return status_res.trim() === 'Charging';
}

const mainJob = jobPlanner(async ({
    charging_frmt=`B: %remaining%%+`,
    discharging_frmt=`B: %remaining%%-`,
    template=`normal`,
    discharged_template=`alert`,
    discharged_trigger=30,
}) => {
    const remaining = await getRemaining();
    const is_charging = await isCharging();

    //const symbol = is_charging ? symbol_charging : symbol_discharging;
    //const remaining_label = ` <span size='small'>${remaining_value}%</span>`
    update(
        templates[remaining < discharged_trigger ? discharged_template : template],
        formatText(is_charging ? charging_frmt : discharging_frmt, {remaining}),
    );
}, 5000);

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
