import { CUSTOM_WIDGET_ONREADY_DOC_URL } from "pages/Editor/CustomWidgetBuilder/constants";

export default {
  uncompiledSrcDoc: {
    html: `<!-- no need to write html, head, body tags, it is handled by the widget -->
<div id="root"></div>
`,
    css: `.app {
  height: calc(var(--appsmith-ui-height) * 1px);
  width: calc(var(--appsmith-ui-width) * 1px);
  justify-content: center;
  border-radius: var(--appsmith-theme-borderRadius);
  box-shadow: var(--appsmith-theme-boxShadow);
  padding: 29px 25px;
  box-sizing: border-box;
  font-family: system-ui;
  background: #fff;
}

.tip-container {
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.571429;
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
  margin-bottom: 9px;
}

.tip-header div {
  color: #999;
}

.content {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.571429;
}

.button-container {
  text-align: right;
  padding-top: 4px;
}

.button-container button {
  margin: 0 10px;
  cursor: pointer;
  border-radius: var(--appsmith-theme-borderRadius);
  padding: 6px 16px;
  background: none;
  height: auto;
  transition: all 0.3s ease;
}

.button-container button.primary {
  background: var(--appsmith-theme-primaryColor) !important;
  color: #fff;
  border: 1px solid var(--appsmith-theme-primaryColor) !important;
}

.button-container button.reset {
  border: 1px solid #999;
  color: #999;
  outline: none;
  box-shadow: none;
}

.button-container button.reset:hover:not(:disabled) {
  color: var(--appsmith-theme-primaryColor);
  border-color: var(--appsmith-theme-primaryColor);
}

.button-container button.reset:disabled {
  cursor: default;
}`,
    js: `import React from "https://esm.sh/react@18.2.0";
import ReactDOM from "https://esm.sh/react-dom@18.2.0";

const Button = ({ children, className, ...props }) => (
  <button className={className} {...props}>
    {children}
  </button>
);

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
    <div className="app">
      <div className="tip-container">
        <div className="tip-header">
          <h2>Custom Widget</h2>
          <div>{currentIndex + 1} / {appsmith.model.tips.length}</div>
        </div>
        <div className="content">{appsmith.model.tips[currentIndex]}</div>
      </div>
      <div className="button-container">
        <Button className="primary" onClick={handleNext}>Next Tip</Button>
        <Button className="reset" disabled={currentIndex === 0} onClick={handleReset}>Reset</Button>
      </div>
    </div>
  );
}

appsmith.onReady(() => {
/*
	 * This handler function will get called when parent application is ready.
	 * Initialize your component here
	 * more info - ${CUSTOM_WIDGET_ONREADY_DOC_URL}
	 */
    ReactDOM.render(<App />, document.getElementById("root"));
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
  border-radius: var(--appsmith-theme-borderRadius);
  box-shadow: var(--appsmith-theme-boxShadow);
  padding: 29px 25px;
  box-sizing: border-box;
  font-family: system-ui;
  background: #fff;
}

.tip-container {
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.571429;
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
  margin-bottom: 9px;
}

.tip-header div {
  color: #999;
}

.content {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.571429;
}

.button-container {
  text-align: right;
  padding-top: 4px;
}

.button-container button {
  margin: 0 10px;
  cursor: pointer;
  border-radius: var(--appsmith-theme-borderRadius);
  padding: 6px 16px;
  background: none;
  height: auto;
  transition: all 0.3s ease;
}

.button-container button.primary {
  background: var(--appsmith-theme-primaryColor) !important;
  color: #fff;
  border: 1px solid var(--appsmith-theme-primaryColor) !important;
}

.button-container button.reset {
  border: 1px solid #999;
  color: #999;
  outline: none;
  box-shadow: none;
}

.button-container button.reset:hover:not(:disabled) {
  color: var(--appsmith-theme-primaryColor);
  border-color: var(--appsmith-theme-primaryColor);
}

.button-container button.reset:disabled {
  cursor: default;
}`,
    js: `import React from "https://esm.sh/react@18.2.0";
import ReactDOM from "https://esm.sh/react-dom@18.2.0";

const Button = ({
  children,
  className,
  ...props
}) => /*#__PURE__*/React.createElement("button", {
  className: className,
  ...props
}, children);

function App() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const handleNext = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % appsmith.model.tips.length);
  };
  const handleReset = () => {
    setCurrentIndex(0);
    appsmith.triggerEvent("onResetClick");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tip-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tip-header"
  }, /*#__PURE__*/React.createElement("h2", null, "Custom Widget"), /*#__PURE__*/React.createElement("div", null, currentIndex + 1, " / ", appsmith.model.tips.length)), /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, appsmith.model.tips[currentIndex])), /*#__PURE__*/React.createElement("div", {
    className: "button-container"
  }, /*#__PURE__*/React.createElement(Button, {
    className: "primary",
    onClick: handleNext
  }, "Next Tip"), /*#__PURE__*/React.createElement(Button, {
    className: "reset",
    disabled: currentIndex === 0,
    onClick: handleReset
  }, "Reset")));
}

appsmith.onReady(() => {
    ReactDOM.render( /*#__PURE__*/React.createElement(App, null), document.getElementById("root"));
});`,
  },
};
