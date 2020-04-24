/**
 * @prettier
 */
"use strict";

/* Module Require */
const pkg = require("../package.json"),
  Manager = require("../lib/manager.js"),
  TU = require("auto-tu");

// Test data
const dataset = {
    Manager: require("./dataset/in/data/manager.json")
  },
  enrichments = require("./dataset/in/resources/enrichments.json");

// Map of functions used in test
const wrapper = {};

/**
 * - classifier
 *   - load()
 */
wrapper.Manager = {
  update: function(fn, item, cb) {
    let update = fn(item.arguments.docObject, enrichments);
    return cb(JSON.stringify(item.arguments.docObject));
  }
};

// Tested Objects
const myObject = {
  Manager: {
    update: Manager.update
  }
};

/**
 * Start test
 */
TU.start({
  description: pkg.name + "/index.js",
  root: "co-enrichment",
  object: myObject,
  wrapper: wrapper,
  dataset: dataset
});
