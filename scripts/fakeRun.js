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

program.requiredOption("--input <input>", colors.yellow(colors.bold("required")) + "  input file").parse(process.argv);

business.initialJob(function () {
  const jsonStream = StreamArray.withParser();

  jsonStream.on("data", ({ key, value }) => {
    console.log("data");
    if (typeof value === "object") {
      return business.doTheJob(value, function () {
        console.log(value.idConditor);
      });
    }
  });

  jsonStream.on("end", () => {
    setTimeout(function () {
      return business.finalJob(null, function () {
        console.log("finalJob done.");
      });
    }, 3000);
    console.log("done.");
  });

  fs.createReadStream(program.input).pipe(jsonStream.input);
});
