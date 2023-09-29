var detect = require('acorn-globals');

const a = JSON.stringify({
    b: () => {
        console.log("Hey!!")
    }
}) 

const iterateOverJSON = (json) => {
    const keys = Object.keys(json)
    for (const key of keys) {
        const value = json[key]
    }

}
const result = JSON.parse(a)
console.log("result after parsing is ", result)

const isFunction = (value) => {
    const fn = new Function("return " + value)
    const result = fn()
    if (typeof(result) == "function") {
        return true
    } else {
        return false;
    }
}

console.log("contains eval ", detect("abc"))
console.log("contains eval ", detect(`eval("hey")`))
console.log("contains eval ", detect(`evaluate("hey")`))
console.log("contains eval ", detect(`this.eval("hey")`))
console.log("contains eval ", detect(`$.eval("hey")`))
console.log("contains eval ", detect(`this.evaluate("hey")`))

try {
    eval(`eval("hey123")`)
    console.log("is function ", isFunction("eval(\"hey\")"))
    console.log("is function ", isFunction("() => {}"))
    console.log("is function ", isFunction("function abc () => {}"))
} catch(error) {
    console.log("error ", error)
}
