/**
 * @prettier
 */
"use strict";

/* Module Require */
const _ = require("lodash");

const Manager = {
  select: function (selector, source, root = "") {
    if (typeof source === "undefined")
      return { source: undefined, value: undefined, root: root !== "" ? root + "." + selector : selector };
    if (selector === "") return { source: source, value: source, root: root !== "" ? root + "." + selector : selector };
    let i = selector.indexOf(".");
    if (i < 0)
      return {
        source: source,
        value: source[selector],
        key: selector,
        root: root !== "" ? root + "." + selector : selector
      };
    else {
      let sup = selector.substring(0, i),
        sub = selector.substring(i + 1),
        data = source[sup],
        s = root !== "" ? root + "." + sup : sup;
      if (Array.isArray(data)) {
        let res = [];
        for (let i = 0; i < data.length; i++) {
          res.push(Manager.select(sub, data[i], s));
        }
        return res;
      } else if (typeof data === "object" && sub.length > 0) return Manager.select(sub, data, s);
      else if (typeof data === "undefined") return Manager.select(sub, data, s);
    }
  },
  update: function (docObject, enrichments) {
    return _.map(enrichments, function (enrichment) {
      let tests = _.mapValues(enrichment.selectors, function (criteria, selector) {
        return _.map(criteria, function (criterion) {
          return Manager.check(Manager.select(selector, docObject), criterion);
        });
      });
      let valid = true;
      for (let [key, value] of Object.entries(tests)) {
        valid =
          valid &&
          value.reduce(function (acc, cur) {
            return acc && !cur.error;
          }, true);
      }
      if (valid)
        return _.mapValues(tests, function (checks, selector) {
          return _.map(checks, function (test) {
            return _.map(test.items, function (item) {
              if (enrichment.target.from === Manager.from.root) return Manager.setEnrichment([docObject], enrichment);
              else if (enrichment.target.from === Manager.from.parent)
                return Manager.setEnrichment([item.data.source], enrichment);
              else if (enrichment.target.from === Manager.from.target)
                return Manager.setEnrichment([item.data.value], enrichment);
              else if (enrichment.target.from === Manager.from.item)
                return Manager.setEnrichment(item.values, enrichment);
              else throw new Error("case not handled");
            });
          });
        });
    });
  },
  setEnrichment: function (sources, enrichment) {
    if (Array.isArray(sources))
      return _.map(sources, function (source) {
        source = Manager.select(enrichment.target.selector, source).source;
        let previousValue = _.get(source, enrichment.target.key, undefined);
        if (!previousValue) _.set(source, enrichment.target.key, enrichment.value);
        else {
          if (typeof previousValue === typeof enrichment.value) Manager.merge(previousValue, enrichment);
        }
      });
    else throw new Error("case not handled");
  },
  merge: function (previous, enrichment) {
    if (Array.isArray(enrichment.value)) {
      if (enrichment.erase) {
        previous = enrichment.value;
      } else
        for (let i = 0; i < enrichment.value.length; i++) {
          let index = previous.indexOf(enrichment.value[i]);
          if (index < 0) previous.push(enrichment.value[i]);
        }
    } else if (typeof enrichment.value === "object") {
      for (let key in enrichment.value) {
        if (typeof previous[key] === "undefined" || enrichment.erase) previous[key] === enrichment.value[key];
      }
    } else if (previous !== enrichment.value && enrichment.erase) {
      previous = enrichment.value;
    }
  },
  check: function (values, criterion) {
    let error = true,
      objs = Array.isArray(values) ? values : [values],
      items = _.map(objs, function (item) {
        let test = Manager.getValid(item.value, criterion);
        if (test.length > 0) {
          error &= false;
          return { error: false, data: item, values: test };
        }
      }).filter(function (item) {
        return item !== undefined;
      });
    return { error, items, criterion };
    value;
  },
  getValid: function (value, criterion) {
    if (typeof criterion === "function" || typeof value === "function") throw new Error("case not handled");
    else if (Array.isArray(criterion) && Array.isArray(value)) return Manager.sameArrays(criterion, value);
    else if (typeof criterion === "object" && typeof value === "object") return Manager.sameObjects(criterion, value);
    else return value === criterion ? [value] : [];
  },
  sameObjects: function (obj, other) {
    let results = [],
      keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      let val1 = obj[keys[i]],
        val2 = other[keys[i]];
      if (typeof val1 === "object" && typeof val2 === "object") {
        let res = Manager.sameObjects(val1, val2);
        if (res.length > 0) results.push(val2);
      } else if (Array.isArray(val1) && Array.isArray(val2)) {
        let res = Manager.sameArrays(val1, val2);
        if (res.length > 0) results.push(val2);
      } else if (val1 === val2) results.push(val2);
    }
    return results;
  },
  sameArrays: function (obj, other) {
    let results = [];
    for (let i = 0; i < obj.length; i++) {
      for (let j = 0; j < other.length; j++) {
        let val1 = obj[i],
          val2 = other[j];
        if (typeof val1 === "object" && typeof val2 === "object") {
          let res = Manager.sameObjects(val1, val2);
          if (res.length > 0) results.push(val2);
        } else if (Array.isArray(val1) && Array.isArray(val2)) {
          let res = Manager.sameArrays(val1, val2);
          if (res.length > 0) results.push(val2);
        } else if (val1 === val2) results.push(val2);
      }
    }
    return results;
  },
  from: {
    root: "root",
    parent: "parent",
    item: "item",
    target: "target"
  }
};

module.exports = Manager;
