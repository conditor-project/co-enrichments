/**
 * @prettier
 */
"use strict";

/* Module Require */
const Manager = require("./lib/manager.js"),
  conf = require("./conf.json"),
  fs = require("fs"),
  path = require("path"),
  async = require("async"),
  StreamArray = require("stream-json/streamers/StreamArray"),
  util = require("util");

const business = {};

business.doTheJob = function(docObject, cb) {
  return async.mapSeries(
    conf.datasets,
    function(item, callback) {
      const jsonStream = StreamArray.withParser();
      jsonStream.on("data", ({ key, value }) => {
        Manager.update(docObject, [value]);
      });
      jsonStream.on("end", () => {
        return callback();
      });
      return fs.createReadStream(path.resolve(__dirname, item)).pipe(jsonStream.input);
    },
    function(err) {
      return cb();
    }
  );
};

module.exports = business;
