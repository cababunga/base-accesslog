# BASE -- Boilerplate API Server Environment

## Access Log Formatter

This is the middleware for BASE router that sends access log entry string into the user provided logging function.

### Install

```sh
npm i @cababunga/accesslog
```

### Use

```javascript
const accesslog = require("@cababunga/accesslog");
app.all("/", accesslog(console.log, {skip: "/health-check"}));
```

`accesslog(logger, options)`

**logger**

A function accepting string as a parameter.

**options**

*format*

A format string. If not provided `"{method} {url} HTTP/{version}" {status} {responseTime} {size} "{user-agent}" {addr}` will be used.

Available tokens:

`url` -- original URL from the request object.
`method` -- HTTP method.
`status` -- HTTP response status.
`version` -- HTTP version.
`size` -- response size in bytes.
`addr` -- client's IP address.
`responseTime` -- time taken to process the request in seconds with nanosecond precision.
`time` -- timestamp.

If the token wasn't one of the above, the middleware will attempt to find a header with this name and substitute its value. If no such header can be found, it will then try recursively to find such names in the request object. For example, if you have `{ id: 123 }` as value of `request.session`, then inserting `{session.id}` in your format string will replace it with `123` for such request.

*skip*

An array of paths for which access logging isn't required.

*time*

A function producing a timestamp as a string. If not provided, timestamp will have form YYY-mm-dd HH:MM:SS.fff.
