/**
 * @prettier
 */
"use strict";

/* Module Require */
const StreamArray = require("stream-json/streamers/StreamArray"),
  program = require("commander"),
  fs = require("fs"),
  async = require("async"),
  business = require("../index.js"),
  colors = require("colors/safe");

program
  .requiredOption("--input <input>", colors.yellow(colors.bold("required")) + "  input file")
  .requiredOption("--output <output>", colors.yellow(colors.bold("required")) + "  output file")
  .parse(process.argv);

try {
  fs.unlinkSync(program.output);
} catch (err) {
  // handle the error
  if (err.errno !== -2) {
    console.log(err);
    process.exit();
  }
}

const jsonStream = StreamArray.withParser(),
  outStream = fs.createWriteStream(program.output, { flags: "a" });

outStream.on("close", function() {
  console.log("finished.");
});

jsonStream.on("data", ({ key, value }) => {
  if (typeof value === "object") {
    return business.doTheJob(value, function() {
      return outStream.write(JSON.stringify(value) + ",\n", err => {
        if (err) throw err;
      });
    });
  }
});

jsonStream.on("end", () => {
  console.log("done.");
});

fs.createReadStream(program.input).pipe(jsonStream.input);
