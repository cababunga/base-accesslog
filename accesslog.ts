import { IncomingMessage, ServerResponse } from "http";

class Request extends IncomingMessage {
    originalUrl?: string;
}

const getAddr = (req: IncomingMessage, at: number=0) => {
    const xff = req.headersDistinct["x-forwarded-for"];
    if (!xff)
        return req.socket.remoteAddress;

    return xff[0].split(/[,\s]+/).at(at);
};

// Middleware for logging requests
const accesslog = (logger: Function, {
    format='"{method} {url} HTTP/{version}" {status} {responseTime} {size} "{user-agent}" {addr}',
    skip=[],
    time=() => new Date().toISOString().replace("T", " ").slice(0, -1),
}={}) => (req: Request, res: ServerResponse) => {
    if ((skip as string[]).includes(req.originalUrl || ""))
        return;

    const start = process.hrtime.bigint();
    let size = 0;
    const write = res.write.bind(res);
    const end = res.end.bind(res);;

    res.write = (chunk: any, ...rest: any[]) => {
        const cb = (rest.length > 0 && typeof rest.at(-1) == "function") ? rest.pop() : undefined;
        if (rest.length == 0)
            size += chunk.length;
        else {
            chunk = Buffer.from(chunk, rest[0])
            size += chunk.length;
        }
        return write(chunk, rest.at(-1));
    };

    res.end = (...param: any[]): ServerResponse<IncomingMessage> => {
        const cb = (param.length > 0 && typeof param.at(-1) == "function") ? param.pop() : undefined;
        if (param.length == 1)
            size += param[0].length;
        else if (param.length == 2) {
            param[0] = Buffer.from(param[0], param[1]);
            size += param[0].length;
            param.splice(1, 1);
        }

        end(...param, cb);

        const replacements: Record<string, Function | string> = {
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
        logger(format.replace(/{([\w\.-]+)}/g, (match: string, capture: string) => {
            if (capture in replacements)
                return replacements[capture] instanceof Function ? replacements[capture]() : replacements[capture];

            if (capture in req.headers)
                return req.headers[capture.toLowerCase()] || "-";

            let obj: Record<string, any> = req;
            for (const x of capture.split("."))
                if ((obj = obj[x]) == undefined)
                    return "-";

            return obj;
        }));
        return res;
    };
};

export default accesslog;
