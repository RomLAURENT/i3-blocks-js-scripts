#!/usr/bin/env node
const indent_parse = /(\t*)(.*)/i
const key_value_parse = /^(([^:=]*)*[:=]\s*)?(.*)$/i

function parse(data) {
    const flow = [{ key: "result", indent_count: -1, children: [] }];
    for (const line of data.split("\n")) {
        const [, indent, raw] = line.match(indent_parse);
        const indent_count = indent.length;
        if (raw && raw.length) {
            const [, , key, value] = raw.match(key_value_parse);
            const children = [];

            if (key) {
                while (flow[0].indent_count >= indent_count) {
                    const it = flow.shift();
                    delete it.indent_count;
                    if (it.value === "") it.value = null;
                }

                const entry = { indent_count, key, value, children };
                flow[0].children.push(entry);
                flow.unshift(entry);
            } else if (value) {
                if (flow[0].value)
                    flow[0].value += `\n${value.trim()}`;
                else
                    flow[0].value = value.trim();
            }
        }
    }
    while (flow[0].indent_count >= 0) {
        const it = flow.shift();
        delete it.indent_count;
        if (it.value === "") it.value = null;
    }

    const parseValue = value => {
        let v = value;
        do {
            if (typeof v === 'string') {
                if (v.startsWith('"') && v.endsWith('"')) {
                    v = v.substring(1, v.length - 1);
                    continue;
                }
                if (v.startsWith('<') && v.endsWith('>')) {
                    v = v.substring(1, v.length - 1);
                    continue;
                }
                if (v === 'yes') {
                    v = true;
                    continue;
                }
                if (v === 'no') {
                    v = false;
                    continue;
                }
                if (/^\d+(\.\d+)?$/.test(v)) {
                    v = Number(v);
                    continue;
                }
            }
            break;
        } while (true);
        return v;
    }

    const simplifyChildren = children =>
        children.reduce((a, { key, value, children }) => ({ ...a, [key.trim()]: simplify({value, children}) }), {});

    const simplify = ({value, children}) =>
        !children.length ? parseValue(value) :
            value === null || value === undefined ? simplifyChildren(children) :
            { value: parseValue(value), ...simplifyChildren(children) };

    return flow[0].children.map(({key,...node}) => ({ ...simplify(node), default: key === "  * index" }));
}

//console.dir(parse(require("fs").readFileSync("./sources.txt", "utf8")), { depth: 4 });

module.exports = parse;