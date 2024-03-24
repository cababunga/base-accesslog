// @ts-check
"use strict";

const getAddr = (req, at=0) =>
    (req.headers["x-forwarded-for"] || "").split(/[,\s]+/).at(at) ||
           req.connection.remoteAddress;

/// Middleware for logging requests
const accesslog = (logger, {
    format='"{method} {url} HTTP/{version}" {status} {responseTime} {size} "{user-agent}" {addr}',
    skip=[],
    time=() => new Date().toISOString().replace("T", " ").slice(0, -1),
}={}) => (req, res) => {
    if (skip.includes(req.originalUrl))
        return;

    const start = process.hrtime.bigint();
    let size = 0;
    const write = res.write;
    const end = res.end;

    res.write = (chunk, encoding, cb) => {
        size += chunk ? chunk.length : 0;
        return write(chunk, encoding, cb);
    };

    res.end = (chunk, encoding, cb) => {
        size += chunk ? chunk.length : 0;

        const replacements = {
            url: () => req.originalUrl,
            method: () => req.method,
            status: () => res.statusCode,
            version: () => req.httpVersion,
            size: () => size,
            addr: () => getAddr(req),
            responseTime: () => { 
                const time = (process.hrtime.bigint() - start).toString().padStart(10, '0');
                return `${time.slice(0, -9)}.${time.slice(-9)}`;
            },
            time,
        };
        logger(format.replace(/{([\w\.-]+)}/g, (match, capture) => {
            if (capture in replacements)
                return replacements[capture]();

            if (capture in req.headers)
                return req.headers[capture.toLowerCase()] || "-";

            let obj = req;
            for (const x of capture.split("."))
                if ((obj = obj[x]) == undefined)
                    return "-";

            return obj;
        }));
        end.call(res, chunk, encoding, cb);
    };
};

module.exports = accesslog;
