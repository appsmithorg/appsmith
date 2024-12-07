import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import { CUSTOM_WIDGET_ONREADY_DOC_URL } from "pages/Editor/CustomWidgetBuilder/constants";

export default {
  key: createMessage(CUSTOM_WIDGET_FEATURE.templateKey.vue),
  uncompiledSrcDoc: {
    html: `<div id="app">
	<div class="tip-container">
		<div class="tip-header">
			<h2>Custom Widget</h2>
			<div id="index">{{ currentIndex + 1 }} / {{ tips.length }}</div>
		</div>
		<div id="tip">{{ tips[currentIndex] }}</div>
	</div>
	<div class="button-container">
		<button @click="next" id="next">Next Tip</button>
		<button @click="reset" id="reset">Reset</button>
	</div>
</div>
<script src="//cdnjs.cloudflare.com/ajax/libs/vue/2.1.6/vue.min.js"></script>`,
    css: `#app {
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
}

.button-container button#next {
	background: var(--appsmith-theme-color-bg-accent) !important;
	color: #fff;
	border:1px solid var(--appsmith-theme-color-bg-accent) !important;
}

.button-container button#reset {
	border: 1px solid #999;
	color: #999;
	outline: none;
	box-shadow: none;
}

.button-container button#reset:hover:not(:disabled) {
	color: var(--appsmith-theme-color-bg-accent);
	border-color: var(--appsmith-theme-color-bg-accent);
}

.button-container button#reset:disabled {
	cursor: default;
}`,
    js: `appsmith.onReady(() => {
  /*
	 * This handler function will get called when parent application is ready.
	 * Initialize your component here
	 * more info - ${CUSTOM_WIDGET_ONREADY_DOC_URL}
	 */
	new Vue({
		el: "#app",
		data() {
			return {
				currentIndex: 0,
				tips: appsmith.model.tips,
			};
		},
		methods: {
			next() {
				this.currentIndex = (this.currentIndex + 1) % this.tips.length;
			},
			reset() {
				this.currentIndex = 0;
				appsmith.triggerEvent("onReset");
			},
		},
	});
});`,
  },
};
