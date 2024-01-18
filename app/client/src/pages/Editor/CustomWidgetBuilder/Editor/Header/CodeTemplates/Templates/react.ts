import {
  CUSTOM_WIDGET_FEATURE,
  createMessage,
} from "@appsmith/constants/messages";
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
	border-radius: var(--appsmith-theme-borderRadius);
	box-shadow: var(--appsmith-theme-boxShadow);
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
	border-radius: var(--appsmith-theme-borderRadius);
}

.button-container button.primary {
	background: var(--appsmith-theme-primaryColor) !important;
}

.button-container button.reset {
	color: var(--appsmith-theme-primaryColor) !important;
	border-color: var(--appsmith-theme-primaryColor) !important;
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
	/*
	 * This handler function will get called when parent application is ready.
	 * Initialize your component here
	 * more info - ${CUSTOM_WIDGET_ONREADY_DOC_URL}
	 */
	reactDom.render(<App />, document.getElementById("root"));
});`,
  },
};
