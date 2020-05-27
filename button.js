#!/usr/bin/env node
const { templates } = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./blocks");


const mainJob = jobPlanner(async ({ symbol, template }) => {
    update(
        templates[template],
        { full_text: symbol }
    );
}, 60000);

eventHandler(async ({ button, leftclick, wheelclick, rightclick, wheelup, wheeldown }) => {
    switch (button) {
        case 1:
            if (leftclick) await execAsync(leftclick);
            break;

        case 2:
            if (wheelclick) await execAsync(wheelclick);
            break;

        case 3:
            if (rightclick) await execAsync(rightclick);
            break;

        case 4:
            if (wheelup) await execAsync(wheelup);
            break;

        case 5:
            if (wheeldown) await execAsync(wheeldown);
            break;
    }
});