#!/usr/bin/env node
const { templates } = require("./conf.json");
const { exec } = require("child_process");
const readline = require('readline');

const execAsync = command => new Promise((resolve, reject) => exec(command, (error, stdout, stderr) => resolve([!error, error, stdout, stderr])));

function formatText(format, values) {
    return Object
        .getOwnPropertyNames(values)
        .reduce((s, n) => s.replace(`%${n}%`, values[n]), format);
}

let previous_value = "";
const update = (...blockdef) => {
    const value = JSON.stringify(
        [templates.default, ...blockdef].reduce(
            (s, v) =>
                v === null ? s :
                    typeof v === 'object' ? { ...s, ...v } :
                        { ...s, full_text: v.toString() },
            {}
        )
    );

    if (previous_value != value) {
        console.log(previous_value = value);
    }
};

const jobPlanner = (job, delay) => {
    let tmHandler = 0;
    const exec = async () => {
        try {
            await job(process.env);
        } catch (e) { console.log(e); }
        tmHandler = setTimeout(exec, delay);
    };
    tmHandler = setTimeout(exec, 0);
    return {
        suspend: () => clearTimeout(tmHandler),
        resume: now => {
            clearTimeout(tmHandler);
            setTimeout(exec, now ? 0 : delay)
        },
    };
}

const eventHandler = handler => {
    var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('line', async (line) => {
        try {
            handler({ ...process.env, ...JSON.parse(line) });
        } catch (e) { }
    });
};

module.exports = {
    execAsync,
    update,
    jobPlanner,
    eventHandler,
    formatText,
};