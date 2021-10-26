const fs = require('fs');
const path = require('path');
const widgets = fs.readdirSync(path.join(__dirname, '../../src/widgets'));

function widgetExists(widget) {
	return widgets.indexOf(widget) >= 0;
}

module.exports = widgetExists;
