#!/usr/bin/env node
const templates = require("./conf.json");
const { exec } = require("child_process");
const readline = require('readline');

const execAsync = command => new Promise((resolve, reject) => exec(command, (error, stdout, stderr) => resolve([!error, error, stdout, stderr])));

let previousValue = "";
const update = (...blockdef) => {
    const value = JSON.stringify(Object.assign({}, templates.default, ...blockdef));
    if(previousValue != value) {
        console.log(previousValue = value);
    }
};

const jobPlanner = (job, delay) => {
    let tmHandler = 0;
    const exec = async () => {
        await job(process.env);
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
    rl.on('line', async (line) => handler({ ...process.env, ...JSON.parse(line) }));
};

module.exports = {
    execAsync,
    update,
    jobPlanner,
    eventHandler
};