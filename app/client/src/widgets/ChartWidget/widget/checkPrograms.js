// yarn add esprima
var esprima = require('esprima');

complicatedProgram = () => {
    const domString = "<div style='position:fixed;top:0;left:0;color:magenta;font-size:70px;z-index:9999'>Poof!</div>"
    const domHTML = `document.body.insertAdjacentHTML('beforeend', ${domString})`
    const program = `(new ((()=>1).constructor)("${domHTML}"))()`
    const characters = program.substring(60)
    console.log("substring is ", characters)
    return program
}

complicatedProgramWithFetch = () => {
    const domString = "<div style='position:fixed;top:0;left:0;color:magenta;font-size:70px;z-index:9999'>Poof!</div>"
    const domHTML = `fetch("www.youtube.com"); document.body.insertAdjacentHTML('beforeend', ${domString});`
    const program = `;(new ((()=>1).constructor)("${domHTML}"))()`
    return program
}

// const programs = ['const a = 1;', "new MyClass();", complicatedProgram(), `fetch("www.appsmith.com")`]

// for (const program of programs) {
//     console.log("\n\nchecking for program\n")
//     console.log(program, "\n")
//     const output = esprima.parse(program, { tokens: true, ecmaFeatures: {impliedStrict: true} })
//     console.log("output is ", output)
// }

// (() => { console.log("Hey IIFEE")})()

// const document = { body: { insertAdjacentHTML: "random" } }
// const rajat = "rajat123"
// const htmlString = `document.body.insertAdjacentHTML("beforeend", "<div>Poof!</div>")`

// const constructorFn = (new ((()=>1).constructor)("rajat"))
// console.log("constructor fn string is ", constructorFn.toString())
// console.log("calling constructor fn")

// const myFuncString = `
//   const rajat = "rajat123"
//   return (${constructorFn.toString()})()
// `
// const myFunc = new Function("return " + myFuncString)
// console.log("my func string is ", myFunc.toString())

// console.log("\n\ncalling my func")
// const result = myFunc()
// console.log('result is ', result)
// // constructorFn()()
// return


// const evalResult = new ((()=>1).constructor)(htmlString)
// console.log("eval result is ", evalResult.toString())

// console.log("\n\n going to calculate the result")
// evalResult()
// console.log("\n\n after calculating to calculate the result")
// return
// console.log(evalResult)

const userFn = (data, secondData) => {
    console.log("document is ", document);
    (new ((()=>1).constructor)(`document.body.insertAdjacentHTML("beforeend", "<div>Poof!</div>")`))()
    return data + secondData
}

// const sandboxFn = (sandboxarg) => {
//     const document = undefined;
//     return (userFn)(sandboxFn)
// }

// const sandboxresult = sandboxFn(6)
// console.log("sandbox result is ", sandboxresult)

const sandboxFnString = ` (...sandbox_args) => {
    const document = undefined;
    const a = (${userFn.toString()})(...sandbox_args)
    return a
}
    `
const newConstructedFn = new Function("return " + sandboxFnString)

console.log("sandbox fn string is ", sandboxFnString)
console.log("new constructed function is ", newConstructedFn.toString())
console.log("new constructed function result is ", newConstructedFn()(4, 6))
return

const iifeTest = () => {
    console.log("running iife test")
    const document = "rajat";
    console.log("document outside nested function is ", document);
    (() => {
        console.log("document INSIDE nested function is ", document);
    })()
    
    // Function = undefined
    // eval = undefined

    // const func = (new ((()=>1).constructor)(`
    //     document.body.insertAdjacentHTML("beforeend", "<div>Poof!</div>")
    // `))
    
    console.log("func string is ", func.toString())
    // func()
}
iifeTest()


// (
//     () => {
//         console.log("document inside nested function is ", document);
//         return 2+3;
//     }
// )()


// const newFn = (data) => {
    
//     // const document = undefined;
//     // const fnString = fn.toString()
//     // const userFn = fn
//     // return userFn
// }
// const funcResult = newFn(2)
// console.log("result is ", newFn(2))

// var math = require('mathjs')
// const node1 = math.parse('a = "agrawal"; return { a: a }')
// const code = node1.compile()
// const result = code.evaluate()

// console.log("node 1 is ", result)