#!/usr/bin/env node
const templates = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./blocks");
const available_values = process.env.available_values.split(',').map(i => Number(i.trim()));

async function getBrightness() {
    const [, , brightness_res] = await execAsync(`xbacklight`);
    const brightness_value = Math.round(brightness_res.trim());
    return brightness_value;
}

const mainJob = jobPlanner(async ({ symbol="B" }) => {
    const brightness_value = await getBrightness();
    const brightness_label = ` <span size='small'>${brightness_value}%</span>`
    update(
        templates.normal,
        {
            full_text: `${symbol}${brightness_label}`,
        }
    );
}, 5000);

eventHandler(async ({ mode, dev, button }) => {
    switch (button) {
        case 1:
            {
                const brightness_value = await getBrightness();
                const newValue = available_values.filter(i => i > brightness_value).shift();
                if(!newValue) break;
                await execAsync(`xbacklight -set ${newValue}`);
                mainJob.resume(true);
                break;
            }
        case 3:
            {
                const brightness_value = await getBrightness();
                const newValue = available_values.filter(i => i < brightness_value).pop();
                if(!newValue) break;
                await execAsync(`xbacklight -set ${newValue}`);
                mainJob.resume(true);
                break;
            }
        case 4:
            await execAsync(`xbacklight -inc 5`);
            mainJob.resume(true);
            break;
        case 5:
            await execAsync(`xbacklight -dec 5`);
            mainJob.resume(true);
            break;
    }
});

process.on('SIGUSR1', ()=> mainJob.resume(true));