export default [
  {
    key: "Blank",
    srcDoc: {
      html: "",
      css: "",
      js: "",
    },
  },
  {
    key: "React",
    srcDoc: {
      html: `<div id="root"></div>`,
      css: `#root {
  font-family: monospace;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}`,
      js: `import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm'
import reactDom from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm'

function App() {
  return (
    <div>
      <h1>
        Hello World by React!
      </h1>
    </div>
  );
}

appsmith.onReady(() => {
  reactDom.render(<App />, document.getElementById("root"));
});
`,
    },
  },
  {
    key: "Vue.js",
    srcDoc: {
      html: `<div id="hello-world-app">
  <h1>{{ msg }}</h1>
</div>
<script
  src="//cdnjs.cloudflare.com/ajax/libs/vue/2.1.6/vue.min.js">
</script>`,
      css: `#hello-world-app {
  font-family: monospace;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}`,
      js: `new Vue({
  el: "#hello-world-app",
  data() {
    return {
      msg: "Hello World by Vue!"
    }
  }
});`,
    },
  },
];
