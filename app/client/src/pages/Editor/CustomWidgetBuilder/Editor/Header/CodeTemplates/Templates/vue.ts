export default {
  key: "Vue.js",
  uncompiledSrcDoc: {
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
};
