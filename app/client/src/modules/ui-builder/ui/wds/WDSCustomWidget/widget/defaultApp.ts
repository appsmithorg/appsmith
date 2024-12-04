import { CUSTOM_WIDGET_ONREADY_DOC_URL } from "pages/Editor/CustomWidgetBuilder/constants";

export default {
  uncompiledSrcDoc: {
    html: `<!-- no need to write html, head, body tags, it is handled by the widget -->
<div id="root"></div>
`,
    css: `.app {
  justify-content: center;
  border-radius: 0px;
  border: none;

  .ant-card-body {
    padding: var(--appsmith-theme-outer-spacing-4) !important;
  }
  
  .tip-container {
    margin-bottom: 20px;

    h2 {
      margin-bottom: 20px;
      font-size: 16px;
      font-weight: 700;
    }

    .tip-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;

      div {
        color: #999;
      }
    }
  }
	
	.button-container {
      text-align: right;

      button {
        margin: 0 10px;
        border-radius: var(--appsmith-theme-border-radius-elevation-3) !important;

        &.primary {
          background: var(--appsmith-theme-color-bg-accent) !important;
        }

        &.reset:not([disabled]) {
          color: var(--appsmith-theme-color-bg-accent) !important;
          border-color: var(--appsmith-theme-color-bg-accent) !important;
        }
      }
    }
}
`,
    js: `import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm'
import reactDom from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm'
import { Button, Card } from 'https://cdn.jsdelivr.net/npm/antd@5.11.1/+esm'
import Markdown from 'https://cdn.jsdelivr.net/npm/react-markdown@9.0.1/+esm';

function App() {
	const [currentIndex, setCurrentIndex] = React.useState(0);

	const handleNext = () => {
		setCurrentIndex((prevIndex) => (prevIndex + 1) % appsmith.model.tips.length);
	};

	const handleReset = () => {
		setCurrentIndex(0);
		appsmith.triggerEvent("onResetClick");
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
				<Button className="reset" disabled={currentIndex === 0} onClick={handleReset}>Reset</Button>
			</div>
	</Card>
);
}

appsmith.onReady(() => {
	/*
	 * This handler function will get called when parent application is ready.
	 * Initialize your component here
	 * more info - ${CUSTOM_WIDGET_ONREADY_DOC_URL}
	 */
	reactDom.render(<App />, document.getElementById("root"));
});`,
  },
  srcDoc: {
    html: `<!-- no need to write html, head, body tags, it is handled by the widget -->
<div id="root"></div>
`,
    css: `html, body {
  background: transparent;
}
    
.app {
	justify-content: center;
	border-radius: 0px;
	border: none;
  background: transparent;
}

.ant-card-body {
  padding: var(--appsmith-theme-outer-spacing-4) !important;
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
	border-radius: var(--appsmith-theme-border-radius-elevation-3) !important;
}

.button-container button.primary {
	background: var(--appsmith-theme-color-bg-accent) !important;
}

.button-container button.reset:not([disabled]) {
	color: var(--appsmith-theme-color-bg-accent) !important;
	border-color: var(--appsmith-theme-color-bg-accent) !important;
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
    appsmith.triggerEvent("onResetClick");
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
	className: "reset",
	disabled: currentIndex === 0,
    onClick: handleReset
  }, "Reset")));
}
appsmith.onReady(() => {
  reactDom.render( /*#__PURE__*/React.createElement(App, null), document.getElementById("root"));
});`,
  },
};
