#!/usr/bin/env node
const { templates } = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./blocks");

const isActive = async connection => (await execAsync(`nmcli connection show --active | grep "${connection}"`))[0];
const toggle = (connection, up) => execAsync(`nmcli connection ${up ? 'up' : 'down'} "${connection}"`);

const mainJob = jobPlanner(async ({ symbol, connection }) => {
    const template = await isActive(connection) ? templates.good : templates.alert;

    update(
        template,
        {
            full_text: symbol,
        }
    );
}, 5000);

eventHandler(async ({ symbol, connection, button }) => {
    switch (button) {
        case 1:
            mainJob.suspend();

            update(
                templates.warning,
                {
                    full_text: symbol,
                }
            );

            await toggle(connection, !await isActive(connection));
            mainJob.resume(true);
            break;
    }
});

process.on('SIGUSR1', () => {
    mainJob.resume(true);
})