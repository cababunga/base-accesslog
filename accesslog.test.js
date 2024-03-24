"use strict";

const assert = require("assert").strict;

const accesslog = require("./accesslog");

describe("Accesslog", () => {
    it("should render response time", () => {
        const logger = str => {
            const x = Number(str);
            assert(x > 0);
            assert(x < 1);
        };
        const req = {
            headers: {},
        };
        const res = {
            end() {},
        };
        accesslog(logger, {format: "{responseTime}"})(req, res);
        res.end();
    });

    it("should add extra tokens", () => {
        const logger = str => {
            assert.equal(str, "123");
        };
        const req = {
            headers: {},
            session: {user_id: "123"},
        };
        const res = {
            end() {},
        };
        accesslog(logger, {format: "{session.user_id}"})(req, res);
        res.end();
    });

    it("should render header value", () => {
        const logger = str => {
            assert.equal(str, "the value");
        };
        const req = {
            headers: {"content-type": "the value"},
        };
        const res = {
            end() {},
        };
        accesslog(logger, {format: "{content-type}"})(req, res);
        res.end();
    });

    it("should not log URLs in skip list", () => {
        let called = false;
        const logger = () => called = true;
        const req = {
            originalUrl: "/skip/it",
        };
        const res = {
            end() {},
        };
        accesslog(logger, {skip: ["/skip/it"]})(req, res);
        res.end();
        assert(!called);
    });

    it("should log URLs not in skip list", () => {
        let called = false;
        const logger = () => called = true;
        const req = {
            originalUrl: "/skip/it/not",
        };
        const res = {
            end() {},
        };
        accesslog(logger, {format: "", skip: ["/skip/it"]})(req, res);
        res.end();
        assert(called);
    });
});

