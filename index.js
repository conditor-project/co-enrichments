/**
 * @prettier
 */
"use strict";

/* Module Require */
const Manager = require("./lib/manager.js"),
  defaultConf = require("./conf.default.json"),
  fs = require("fs"),
  path = require("path"),
  async = require("async"),
  StreamArray = require("stream-json/streamers/StreamArray");

const business = {};

business.doTheJob = function (docObject, cb) {
  let conf = defaultConf;
  if (typeof business.config !== "undefined") Object.assign(conf, business.config);
  return async.mapSeries(
    conf.datasets,
    function (item, callback) {
      const jsonStream = StreamArray.withParser();
      jsonStream.on("data", ({ key, value }) => {
        Manager.update(docObject, [value]);
      });
      jsonStream.on("end", () => {
        return callback();
      });
      let filename = path.resolve(__dirname, item);
      return fs.stat(filename, function (err, res) {
        if (err) return callback(err);
        else if (!res.isFile()) return callback(new Error(filename + " is not a file"));
        else return fs.createReadStream(filename).pipe(jsonStream.input);
      });
    },
    function (err) {
      if (typeof err !== "undefined" && err) docObject.error = err;
      return cb(err);
    }
  );
};

module.exports = business;
