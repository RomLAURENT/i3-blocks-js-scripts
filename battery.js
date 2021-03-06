#!/usr/bin/env node
process.title = "i3blocks-js-battery";

const { templates } = require("./conf.json");
const { formatText, execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

async function getRemaining(device) {
    const [, , remaining_res] = await execAsync(`cat /sys/class/power_supply/${device}/capacity`);
    const remaining = remaining_res.trim();
    return Number(remaining);
}

async function isCharging(device) {
    const [, , status_res] = await execAsync(`cat /sys/class/power_supply/${device}/status`);
    return status_res.trim() === 'Charging';
}

const mainJob = jobPlanner(async ({
    device = `BAT1`,

    frmt = `BAT: %remaining%% %status%`,

    status_charging = `+`,
    status_discharging = `-`,

    full_trigger = 82,
    full_template = `good`,
    full_symbol = ``,

    normal_template = `normal`,
    normal_symbol = ``,

    warning_trigger = 30,
    warning_template = `warning`,
    warning_symbol = ``,

    alert_trigger = 10,
    alert_template = `alert`,
    alert_symbol = ``,
}) => {
    const remaining = await getRemaining(device);
    const is_charging = await isCharging(device);

    const template = templates[
        remaining > full_trigger ? full_template :
            remaining < alert_trigger ? alert_template :
                remaining < warning_template ? warning_template :
                    normal_template
    ];

    const symbol =
        remaining > full_trigger ? full_symbol :
            remaining < alert_trigger ? alert_symbol :
                remaining < warning_template ? warning_symbol :
                    normal_symbol
        ;

    const status = remaining > full_trigger ? status_charging : status_discharging;

    update(
        template,
        formatText(
            frmt,
            {
                symbol,
                status,
                remaining,
            }
        )
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
