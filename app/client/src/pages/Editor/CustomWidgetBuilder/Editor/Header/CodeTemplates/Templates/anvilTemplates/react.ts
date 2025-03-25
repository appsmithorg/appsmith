import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import { CUSTOM_WIDGET_ONREADY_DOC_URL } from "pages/Editor/CustomWidgetBuilder/constants";

export default {
  key: createMessage(CUSTOM_WIDGET_FEATURE.templateKey.react),
  uncompiledSrcDoc: {
    html: `<!-- no need to write html, head, body tags, it is handled by the widget -->
<div id="root"></div>
`,
    css: `.app {
  height: calc(var(--appsmith-ui-height) * 1px);
  width: calc(var(--appsmith-ui-width) * 1px);
  justify-content: center;
  border-radius: var(--appsmith-theme-border-radius-elevation-3);
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
  border-radius: var(--appsmith-theme-border-radius-elevation-3);
  padding: 6px 16px;
  background: none;
  height: auto;
  transition: all 0.3s ease;
}

.button-container button.primary {
  background: var(--appsmith-theme-color-bg-accent) !important;
  color: #fff;
  border: 1px solid var(--appsmith-theme-color-bg-accent) !important;
}

.button-container button.primary:hover {
  opacity: 0.8;
}

.button-container button.reset {
  border: 1px solid #999;
  color: #999;
  outline: none;
  box-shadow: none;
}

.button-container button.reset:hover:not(:disabled) {
  color: var(--appsmith-theme-color-bg-accent);
  border-color: var(--appsmith-theme-color-bg-accent);
}

.button-container button.reset:disabled {
  cursor: default;
}`,
    js: `import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm'
import reactDom from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm'

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
  reactDom.render(<App />, document.getElementById("root"));
});`,
  },
};
