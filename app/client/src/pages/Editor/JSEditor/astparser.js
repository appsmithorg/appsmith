let acorn = require("acorn");

const input = () => {
    const a = document.getElementById("rajat")
}
const result = acorn.parse(input.toString())

console.log("result from ast parsing is ", result, result.body[0])
