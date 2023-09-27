const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const maliciousString = ";(new ((()=>1).constructor)(`document.body.insertAdjacentHTML(\"beforeend\", \"<div style='position:fixed;top:0;left:0;color:magenta;font-size:70px;z-index:9999'>Poof!</div>\")`))()"
// const domHTML = `<script>const a = 1; ${maliciousString}</script><b>hello there 123</b>`
const domHTML = `<script>fetch("endpoint");eval("new ((()=>1).constructor)(document.body.insertAdjacentHTML())")</script><b>hello there 123</b>`
// console.log("dompurify", "domHTML is ", domHTML)

    // USE_PROFILES: { html: true }
let clean = DOMPurify.sanitize(domHTML, { FORCE_BODY: true, ADD_TAGS: ["script", "iframe" ] });
console.log("dompurify", "result is ", clean)