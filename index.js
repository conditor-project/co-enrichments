/**
 * @prettier
 */
"use strict";

/* Module Require */
const Manager = require("./lib/manager.js"),
  defaultConf = require("./conf.default.json"),
  async = require("async"),
  _ = require("lodash"),
  mongoose = require("mongoose");

const business = {};

let models = {},
  db = mongoose.connection,
  conf = defaultConf,
  metadata = [];

business.metadataModel = mongoose.model(
  conf.mongodb.metadata,
  new mongoose.Schema(
    {
      enrichment: String,
      selectors: Array
    },
    { collection: conf.mongodb.metadata }
  )
);

business.buildModel = function (collection) {
  if (typeof models[collection] === "undefined")
    models[collection] = mongoose.model(
      collection,
      new mongoose.Schema(
        {
          selectors: Array,
          target: Object,
          value: mongoose.Mixed
        },
        { collection: collection }
      )
    );
  return models[collection];
};

business.initialJob = function (cb) {
  if (typeof business.config !== "undefined") Object.assign(conf, business.config);
  return mongoose.connect(conf.mongodb.connectUrl, conf.mongodb.connectOpts, function (err) {
    if (err) console.log(err);
    return async.map(
      conf.enrichments,
      function (enrichment, callback) {
        return business.metadataModel.find({ enrichment: enrichment.collection }).exec(function (err, results) {
          if (err) console.log(err);
          if (!err && results.length > 0)
            results.map(function (result) {
              metadata.push(result);
            });
          return callback();
        });
      },
      function (err) {
        if (err) console.log(err);
        return cb();
      }
    );
  });
};

business.doTheJob = function (docObject, cb) {
  return async.mapLimit(
    metadata,
    conf.limit,
    function (item, callback) {
      let model = business.buildModel(item.enrichment),
        query = {};
      for (let i = 0; i < item.selectors.length; i++) {
        let values = Manager.select(item.selectors[i], docObject),
          data = getData(values);
        if (data.length > 0) {
          if (typeof query["selectors.selector"] === "undefined") query["selectors.selector"] = { $in: [] };
          query["selectors.selector"]["$in"].push(item.selectors[i]);
          if (typeof query["selectors.values"] === "undefined") query["selectors.values"] = { $in: [] };
          query["selectors.values"]["$in"].push(data[0]);
        }
      }
      if (Object.keys(query).length > 0)
        model.find(query).exec(function (err, enrichments) {
          if (!err && enrichments.length > 0) {
            Manager.update(docObject, enrichments);
          }
          return callback();
        });
      else return callback();
    },
    function (err) {
      return cb(err);
    }
  );
};

business.finalJob = function (docObjects, cb) {
  db.close();
  return cb();
};

function getData(data) {
  if (Array.isArray(data)) {
    let arr = _.flatten(
      data.map(function (x) {
        return x.value;
      })
    );
    return Array.isArray(arr)
      ? arr.map(function (x) {
          if (typeof x !== "undefined") return [x];
        })
      : [];
  } else if (typeof data !== "undefined" && typeof data.value !== "undefined")
    return Array.isArray(data.value) ? data.value : [data.value];
  else return [];
}

module.exports = business;
