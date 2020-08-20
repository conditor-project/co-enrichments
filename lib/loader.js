/**
 * @prettier
 */
"use strict";

let loader = {
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
    }, 1000);
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
};

module.exports = loader;
