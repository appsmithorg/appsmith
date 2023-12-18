export default {
  uncompiledSrcDoc: {
    html: `<!-- no need to write html, head, body tags, it is handled by the widget -->
<div id="root"></div>
`,
    css: `.app {
	height: calc(var(--appsmith-ui-height) * 1px);
	width: calc(var(--appsmith-ui-width) * 1px);
	justify-content: center;
}

.tip-container {
  margin-bottom: 20px;
}

.tip-container h2 {
  margin-bottom: 20px;
	font-size: 16px;
	font-weight: 700;
}

.tip-header {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
}

.tip-header div {
	color: #999;
}

.button-container {
	text-align: right;	
}

.button-container button {
  margin: 0 10px;
}`,
    js: `import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm'
import reactDom from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm'
import { Button, Card } from 'https://cdn.jsdelivr.net/npm/antd@5.11.1/+esm'
import Markdown from 'https://cdn.jsdelivr.net/npm/react-markdown@9.0.1/+esm'

function App() {
	const [currentIndex, setCurrentIndex] = React.useState(0);

	const handleNext = () => {
		setCurrentIndex((prevIndex) => (prevIndex + 1) % appsmith.model.tips.length);
	};

	const handleReset = () => {
		setCurrentIndex(0);
		appsmith.triggerEvent("onReset");
	};

	return (
		<Card className="app">
			<div className="tip-container">
				<div className="tip-header">
					<h2>Custom Widget</h2>
					<div>{currentIndex + 1} / {appsmith.model.tips.length}		</div>
				</div>
				<Markdown>{appsmith.model.tips[currentIndex]}</Markdown>
			</div>
			<div className="button-container">
				<Button className="primary" onClick={handleNext} type="primary">Next Tip</Button>
				<Button onClick={handleReset}>Reset</Button>
			</div>
	</Card>
);
}

appsmith.onReady(() => {
	reactDom.render(<App />, document.getElementById("root"));
});`,
  },
  srcDoc: {
    html: `<!-- no need to write html, head, body tags, it is handled by the widget -->
<div id="root"></div>
`,
    css: `.app {
	height: calc(var(--appsmith-ui-height) * 1px);
	width: calc(var(--appsmith-ui-width) * 1px);
	justify-content: center;
}

.tip-container {
  margin-bottom: 20px;
}

.tip-container h2 {
  margin-bottom: 20px;
	font-size: 16px;
	font-weight: 700;
}

.tip-header {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
}

.tip-header div {
	color: #999;
}

.button-container {
	text-align: right;	
}

.button-container button {
  margin: 0 10px;
}`,
    js: `import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import reactDom from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm';
import { Button, Card } from 'https://cdn.jsdelivr.net/npm/antd@5.11.1/+esm';
import Markdown from 'https://cdn.jsdelivr.net/npm/react-markdown@9.0.1/+esm';

function App() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const handleNext = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % appsmith.model.tips.length);
  };
  const handleReset = () => {
    setCurrentIndex(0);
    appsmith.triggerEvent("onReset");
  };
  return /*#__PURE__*/React.createElement(Card, {
    className: "app",
  }, /*#__PURE__*/React.createElement("div", {
    className: "tip-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tip-header"
  }, /*#__PURE__*/React.createElement("h2", null, "Custom Widget"), /*#__PURE__*/React.createElement("div", null, currentIndex + 1, " / ", appsmith.model.tips.length, "  ")), /*#__PURE__*/React.createElement(Markdown, null, appsmith.model.tips[currentIndex])), /*#__PURE__*/React.createElement("div", {
    className: "button-container"
  }, /*#__PURE__*/React.createElement(Button, {
    className: "primary",
    onClick: handleNext,
    type: "primary"
  }, "Next Tip"), /*#__PURE__*/React.createElement(Button, {
    onClick: handleReset
  }, "Reset")));
}
appsmith.onReady(() => {
  reactDom.render( /*#__PURE__*/React.createElement(App, null), document.getElementById("root"));
});`,
  },
};
