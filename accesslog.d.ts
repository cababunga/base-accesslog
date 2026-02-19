import { IncomingMessage, ServerResponse } from "http";

declare module "accesslog" {
    interface AccessLogOptions {
        format?: string;
        skip?: string[];
        time?: () => string;
    }

    type Logger = (message: string) => void;

    type Middleware = (req: IncomingMessage, res: ServerResponse) => void;

    function accesslog(logger: Logger, options?: AccessLogOptions): Middleware;

    export default accesslog;
}