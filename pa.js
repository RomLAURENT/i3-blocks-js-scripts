#!/usr/bin/env node
process.title = "i3blocks-js-pa";

const { templates } = require("./conf.json");
const paParser = require("./pa-parser");
const { formatText, execAsync, update, jobPlanner, eventHandler } = require("./i3-blocks-helper");

const getPAStatus = async (mode) => {
    const [, , raw] = await execAsync(`pacmd list-${mode}s`);
    const status = paParser(raw);
    return status;
}
const getStreams = async (mode, dev) => {
    const [, , raw] = await execAsync(`pacmd list-${mode}-${mode === `sink` ? `inputs` : `outputs`} ${dev}`);
    const status = paParser(raw);
    return status;
}

function getPortLabel(port) {
    return process.env[`port_label_${port}`] || process.env[`port_label_undefined`] || port;
}

function getDevLabel(dev) {
    return process.env[`dev_label_${dev}`] || process.env[`dev_label_undefined`] || dev;
}

const mainJob = jobPlanner(async ({
    mode,

    frmt = `%dev%,%port% : %volume%%`,
    template = "normal",

    frmt_muted = `%dev%,%port% : MUTED`,
    muted_template = "alert",
}) => {
    const all_entries = await getPAStatus(mode);
    const default_entry = all_entries.filter(c => c.default)[0];
    const [, volume] = default_entry.volume.match(/(\d+)%/i) || [];

    update(
        templates[default_entry.muted ? muted_template : template],
        formatText(default_entry.muted ? frmt_muted : frmt, {
            port: getPortLabel(default_entry["active port"]),
            dev: getDevLabel(default_entry.name),
            volume,
        })
    );
}, 5000);

eventHandler(async ({ mode, button }) => {
    try {
        const default_dev = mode == "sink" ? "@DEFAULT_SINK@" : "@DEFAULT_SOURCE@";
        switch (button) {
            case 1:
                {
                    await execAsync(`pactl set-${mode}-mute ${default_dev} toggle`);
                    mainJob.resume(true);
                }
                break;

            case 3:
                {
                    const status = await getPAStatus(mode);

                    const entries = status
                        .filter(d => d.default || d.properties["device.class"] != "monitor")
                        .flatMap(d => Object.keys(d.ports).map(p => ({
                            device: d.value,
                            port: p,
                            current: !!(d.default && p === d["active port"]),
                        })));

                    const current_entry = entries.filter(c => c.current)[0];

                    const new_default = entries[(entries.indexOf(current_entry) + 1) % entries.length];

                    await execAsync(`pactl set-${mode}-port ${new_default.device} ${new_default.port}`);

                    if(current_entry.device !== new_default.device) {
                        await execAsync(`pactl set-default-${mode} ${new_default.device}`);
                        const streams = (await getStreams(mode, current_entry.device)).map(d => d.value);

                        for (const stream of streams) {
                            await execAsync(`pacmd move-${mode}-input ${stream} ${new_default.device}`);
                        }
                    }
                    mainJob.resume(true);
                }
                break;
            //     {
            //         const status = await getPAStatus(mode);

            //         const default_entry = status
            //             .filter(c => c.default)
            //             .map(d => d.value)[0];

            //         const entries = status
            //             .filter(c => c.default || c.properties["device.class"] != "monitor")
            //             .map(d => d.value);

            //         const streams = (await getStreams(mode, default_entry))
            //             .map(d => d.value);

            //         const new_default = entries[(entries.indexOf(default_entry) + 1) % entries.length];

            //         await execAsync(`pactl set-default-${mode} ${new_default}`);
            //         for (const stream of streams) {
            //             await execAsync(`pacmd move-${mode}-input ${stream} ${new_default}`);
            //         }
            //         mainJob.resume(true);
            //     }
            //     break;

            // case 2:
            //     {
            //         const all_entries = await getPAStatus(mode);
            //         const default_entry = all_entries.filter(c => c.default)[0];
            //         const active_port = default_entry["active port"];
            //         const ports = Object.keys(default_entry["ports"]);

            //         const new_port = ports[(ports.indexOf(active_port) + 1) % ports.length];

            //         await execAsync(`pactl set-${mode}-port ${default_dev} ${new_port}`);
            //         mainJob.resume(true);
            //     }
            //     break;
            case 4:
                {
                    await execAsync(`pactl set-${mode}-volume ${default_dev} +5%`);
                    mainJob.resume(true);
                }
                break;

            case 5:
                {
                    await execAsync(`pactl set-${mode}-volume ${default_dev} -5%`);
                    mainJob.resume(true);
                }
                break;
        }
    } catch (e) {
        mainJob.resume(true);
    }
});

process.on('SIGUSR1', () => {
    mainJob.resume(true);
});