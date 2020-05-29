#!/usr/bin/env node
process.title = "i3blocks-js-pa";

const { templates } = require("./conf.json");
const paParser = require("./pa-parser");
const { formatText, execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

const getPAStatus = async (mode, dev) => {
    const [, , raw] = await execAsync(`pacmd list-${mode}s`);
    const status = paParser(raw);
    return status.filter(c => c.value == dev)[0];
}

function getPortLabel (port) {
    return process.env[`port_label_${port}`] || process.env[`port_label_undefined`] || port;
}

const mainJob = jobPlanner(async ({
    mode,
    dev,

    frmt = `%port% : %volume%%`,
    template = "normal",

    frmt_muted = `%port% : MUTED`,
    muted_template = "alert",
}) => {
    const status = await getPAStatus(mode, dev);
    const [, vol_left_raw, vol_left_pc, vol_left_db] = status.volume.match(/front\-left\:\s+(\d+)\s+\/\s+(\d+)%\s+\/\s+(\-?\d+,\d+)\s+dB/i) || [];
    const [, vol_right_raw, vol_right_pc, vol_right_db] = status.volume.match(/front\-right\:\s+(\d+)\s+\/\s+(\d+)%\s+\/\s+(\-?\d+,\d+)\s+dB/i) || [];

    update(
        templates[status.muted ? muted_template : template],
        formatText(status.muted ? frmt_muted : frmt, {
            port: getPortLabel(status["active port"]),
            volume: vol_left_pc || vol_right_pc,
            vol_left_raw,
            vol_left_pc,
            vol_left_db,
            vol_right_raw,
            vol_right_pc,
            vol_right_db,
        })
    );
}, 500);

eventHandler(async ({ mode, dev, button, wheel_click }) => {
    switch (button) {
        case 1:
            {
                await execAsync(`pactl set-${mode}-mute ${dev} toggle`);
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
                const status = await getPAStatus(mode, dev);
                const active_port = status["active port"];
                const ports = Object.keys(status["ports"]);

                const new_port = ports[(ports.indexOf(active_port) + 1) % ports.length];

                console.log(active_port,ports,new_port);
                await execAsync(`pacmd set-${mode}-port ${dev} ${new_port}`);
                mainJob.resume(true);
            }
            break;

        case 4:
            {
                await execAsync(`pactl set-${mode}-volume ${dev} +5%`);
                mainJob.resume(true);
            }
            break;

        case 5:
            {
                await execAsync(`pactl set-${mode}-volume ${dev} -5%`);
                mainJob.resume(true);
            }
            break;
    }
});

process.on('SIGUSR1', () => {
    mainJob.resume(true);
})