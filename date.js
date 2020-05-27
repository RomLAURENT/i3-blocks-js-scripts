#!/usr/bin/env node
const { format } = require("date-fns");
const locales = require('date-fns/locale');
const { templates } = require("./conf.json");
const { execAsync, update, jobPlanner, eventHandler } = require("./blocks");

const patterns = [process.env.pattern, process.env.altpattern].filter(i => !!i);

const mainJob = jobPlanner(async ({ symbol, locale = "fr" }) => {
    update(
        templates.normal,
        {
            full_text: `${symbol} <span size='small'>${format(new Date(), patterns[0], { locale: locales[locale] })}</span>`,
        }
    );
}, 500);

eventHandler(async ({ button, leftclick, wheelclick, rightclick, wheelup, wheeldown }) => {
    switch (button) {
        case 1:
            patterns.push(patterns.shift());
            mainJob.resume(true);
            break;
    }
});
