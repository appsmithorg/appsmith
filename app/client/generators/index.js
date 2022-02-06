const fs = require("fs");
const path = require("path");
const widgetGenerator = require("./widget/index.js");

module.exports = (plop) => {
  plop.setGenerator("widget", widgetGenerator);
  plop.addHelper("directory", (widget) => {
    try {
      fs.accesSync(path.join(__dirname, `../src/widgets/${widget}`), fs.F_OK);
      return `widgets/${widget}`;
    } catch (e) {
      return `widgets/${widget}`;
    }
  });
  plop.addHelper("suffixed", (name) => {
    return `${name}Widget`;
  });
  plop.addHelper("widgetTypeFormat", (name) => {
    return `${name.toUpperCase()}_WIDGET`;
  });
};
