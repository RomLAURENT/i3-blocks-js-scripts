#!/usr/bin/env node
const { templates } = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

const isActive = async connection => (await execAsync(`nmcli connection show --active | grep "${connection}"`))[0];
const toggle = (connection, up) => execAsync(`nmcli connection ${up ? 'up' : 'down'} "${connection}"`);

const mainJob = jobPlanner(async ({ symbol, connection }) => {
    const template = await isActive(connection) ? templates.good : templates.alert;

    update(
        template,
        symbol
    );
}, 5000);

eventHandler(async ({ symbol, connection, button, wheel_click, right_click, wheel_up, wheel_down }) => {
    switch (button) {
        case 1:
            {
                mainJob.suspend();

                update(
                    templates.warning,
                    symbol
                );

                await toggle(connection, !await isActive(connection));
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
})