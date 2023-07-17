const fs = require("fs");
const path = require("path");
const widgetGenerator = require("./widget/index.js");

module.exports = (plop) => {
  plop.setGenerator("widget", widgetGenerator);

  plop.addHelper("directory", (widget) => {
    const widgetPath = path.join(__dirname, `../src/widgets/${widget}`);
    try {
      fs.accessSync(widgetPath, fs.constants.F_OK);
    } catch (e) {
      return `widgets/${widget}`;
    }
    return `widgets/${widget}`;
  });

  plop.addHelper("suffixed", (name) => {
    return `${name}Widget`;
  });

  plop.addHelper("widgetTypeFormat", (name) => {
    return `${name.toUpperCase()}_WIDGET`;
  });
};
