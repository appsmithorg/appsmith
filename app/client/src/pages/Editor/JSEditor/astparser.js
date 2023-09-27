let acorn = require("acorn");
// const fnString = `;(new ((()=>1).constructor)("document.body.insertAdjacentHTML('beforeend', "<div style='position:fixed;top:0;left:0;color:magenta;font-size:70px;z-index:9999'>Poof!</div>")\`))()`


const fnString = "(new ((()=>1).constructor)"
const splitString = fnString.split('')

let arrayOutput = "";
for (const c of splitString) {
    arrayOutput += `'${c}', `
}
// console.log(arrayOutput)
console.log("split string is ", splitString)

let constructedFnString = ""
for (const c of splitString) {
    constructedFnString += c;
}
console.log("constructed fn string is ", constructedFnString)

const input = () => {
    const a = document.getElementById("rajat")
    // const error = new Error("Hey!")
    // alert("rajat")
    // fetch("abcd")
    const str = ""
    for (let i = 0; i < 4; i++) {
        str += "a"
    }
    console.log("str is ", str)
    return "${a}$"
}
// console.log(input.toString())
const result = acorn.parse(input.toString())

// console.log("result from ast parsing is ", JSON.stringify(result, null, 2))
