/**
 * @prettier
 */
"use strict";

/* Module Require */
const StreamArray = require("stream-json/streamers/StreamArray"),
  program = require("commander"),
  fs = require("fs"),
  async = require("async"),
  mongoose = require("mongoose"),
  stream = require("stream"),
  business = require("../index.js"),
  defaultConf = require("../conf.default.json"),
  colors = require("colors/safe");

program
  .requiredOption("--input <input>", colors.yellow(colors.bold("required")) + "   input file")
  .requiredOption("--collection <collection>", colors.yellow(colors.bold("required")) + "   name of mongodb collection")
  .option(
    "--deduplicate",
    colors.gray(colors.bold("optionnal")) +
      "  deduplicate enrichment(s). It will force --limit value to 1 (& increase processing times)"
  )
  .option("--limit <limit>", colors.gray(colors.bold("optionnal")) + "  max number of enrichments in queue", 1)
  .parse(process.argv);

let count = {
    metadata: {
      success: 0,
      duplicate: 0,
      error: []
    },
    enrichment: {
      success: 0,
      duplicate: [],
      all: 0,
      error: []
    }
  },
  allMetadata = {},
  transactions = [],
  limit = program.deduplicate ? 1 : parseInt(program.limit);

try {
  if (!fs.statSync(program.input).isFile()) {
    console.log('invalid value of --input : "' + program.input + '" is not a file.');
    process.exit(0);
  }
} catch {
  console.log('invalid value of --input : "' + program.input + '" is an invalid path.');
  process.exit(0);
}

if (isNaN(limit)) {
  console.log('invalid value of --limit : "' + program.limit + '" is not a number.');
  process.exit(0);
}

if (program.deduplicate && program.limit !== 1) {
  console.log(
    colors.yellow(
      "Warning : You have set --deduplicate parameter, so --limit value has been set to " +
        limit +
        " (use --help for more infos)"
    )
  );
}

const db = mongoose.connection,
  buildMetadata = function (collection, selectors) {
    return {
      enrichment: collection,
      selectors: selectors
    };
  },
  checkEnrichment = function (enrichment, cb) {
    let model = business.buildModel(program.collection);
    return model.find(enrichment).exec(function (err, results) {
      if (err) return cb(err);
      if (results.length === 0) return cb(false);
      else return cb(true, results);
    });
  },
  insertEnrichment = function (enrichment, cb) {
    let model = business.buildModel(program.collection);
    return model.create(enrichment, function (err, res) {
      if (err) return cb(err);
      return cb(undefined, res);
    });
  },
  checkAndInsertMetadata = function (metadata, cb) {
    return business.metadataModel
      .find({ enrichment: metadata.enrichment, selectors: { $all: metadata.selectors } })
      .exec(function (err, results) {
        if (err) cb(err);
        if (!err && results.length === 0)
          return business.metadataModel.create(metadata, function (err, res) {
            if (err) return cb(err);
            return cb(undefined, res);
          });
        else return cb(true);
      });
  },
  closeConnection = function () {
    return async.eachOfSeries(
      allMetadata,
      function (value, key, cb) {
        return checkAndInsertMetadata(value, function (err) {
          if (typeof err !== "undefined") {
            if (typeof err === "boolean") count.metadata.duplicate++;
            else count.metadata.error.push(err);
          } else count.metadata.success++;
          return cb();
        });
      },
      function () {
        return db.close(function (err) {
          if (err) console.error(err.message);
          loader.stop();
          stats.display(count);
        });
      }
    );
  },
  loader = {
    start: function (label, count) {
      const P = [".", "..", "..."];
      let x = 0;
      this.label = label;
      this.count = count;
      this.interval = setInterval(() => {
        let str = typeof this.count !== "undefined" ? " (" + this.count + ")" : P[x++];
        process.stdout.write("\r" + this.label + " ".repeat(str.length + 3));
        process.stdout.write("\r" + this.label + str);
        x %= P.length;
      }, 500);
    },
    stop: function (msg = "done.") {
      let str = typeof this.count !== "undefined" ? "..." + " (" + this.count + ")" : "...";
      process.stdout.write("\r" + this.label + " ".repeat(str.length + 3));
      process.stdout.write("\r" + this.label + str + " " + msg + "\n");
      return clearInterval(this.interval);
    },
    refresh: function (count) {
      this.count = count;
    }
  },
  stats = {
    display: function (data) {
      let time = Date.now() - begin;
      console.log("----------------------------------------");
      console.log("-               metadata               -");
      console.log("----------------------------------------");
      console.log(" new metadata :\t\t\t" + data.metadata.success);
      console.log(" duplicate(s) metadata :\t" + data.metadata.duplicate);
      console.log(" metadata error(s) :\t\t" + data.enrichment.error.length);
      console.log("----------------------------------------");
      console.log("----------------------------------------");
      console.log("-              enrichments             -");
      console.log("----------------------------------------");
      console.log(" new enrichment(s) :\t\t" + data.enrichment.success);
      console.log(" duplicate(s) enrichment(s) :\t" + data.enrichment.duplicate.length);
      console.log(" enrichment(s) error(s) :\t" + data.enrichment.error.length);
      console.log("----------------------------------------");
      console.log("");
      console.log(data.enrichment.all + " enrichment(s) processed.");
      console.log("processing time : " + time + " ms.");
      console.log("average processing time per enrichment : " + time / data.enrichment.all + " ms.");
      if (data.enrichment.duplicate.length > 0) {
        console.log("");
        console.log("mongodb id(s) of duplicate(s) enrichment(s) :");
        data.enrichment.duplicate.map(function (duplicates) {
          return duplicates.map(function (item) {
            console.log(item._id);
          });
        });
      }
    }
  };

const begin = Date.now();

loader.start("Connecting to : " + defaultConf.mongodb.connectUrl);
return mongoose.connect(defaultConf.mongodb.connectUrl, defaultConf.mongodb.connectOpts, function (err) {
  loader.stop();
  loader.start("Insert enrichments into mongodb", 0);
  class MyWritable extends stream.Writable {
    constructor(options = {}) {
      super(options);
    }
    write(chunk) {
      let enrichment = chunk.value,
        metadata = {
          enrichment: program.collection,
          selectors: enrichment.selectors.map(function (item) {
            return item.selector;
          })
        },
        key = JSON.stringify(metadata.selectors);
      if (typeof allMetadata[key] === "undefined") allMetadata[key] = metadata;
      count.enrichment.all++;
      transactions.push(true);
      let finalCallback = (err) => {
          loader.refresh(count.enrichment.all);
          if (err) console.error(err);
          transactions.pop();
          if (transactions.length < limit) this.emit("drain");
        },
        insertCallback = (err) => {
          if (err) count.enrichment.error.push(err);
          else count.enrichment.success++;
          return finalCallback(err);
        };
      if (program.deduplicate) {
        checkEnrichment(enrichment, (err, res) => {
          if (typeof err === "boolean") {
            if (err) {
              count.enrichment.duplicate.push(res);
              return finalCallback();
            } else return insertEnrichment(enrichment, insertCallback);
          } else {
            count.enrichment.error.push(err);
            return finalCallback(err);
          }
        });
      } else insertEnrichment(enrichment, insertCallback);
      return transactions.length < limit;
    }
  }

  const jsonStream = StreamArray.withParser(),
    mongodbStream = new MyWritable({ autoDestroy: true });

  fs.createReadStream(program.input).pipe(jsonStream.input);
  jsonStream.pipe(mongodbStream);

  mongodbStream.on("finish", () => {
    if (transactions.length > 0)
      return async.doUntil(
        function (cb) {
          setTimeout(function () {
            return cb();
          }, 1000);
        },
        function (cb) {
          return cb(transactions.length === 0);
        },
        function () {
          return closeConnection();
        }
      );
    else return closeConnection();
  });
});
