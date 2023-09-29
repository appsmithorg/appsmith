const detect = require('acorn-globals');

str1 = `var hey = 1; hey`
str2 = "() => {}"

myvar = "hey"
a = `${str1}`
a2 = `${str2}`

try {
    const hey = 1;
    const myFunc = new Function(a)
    console.log("my func 1 is ", myFunc)
    try {
        console.log(myFunc.toString(), myFunc())
    } catch(error) {
        console.log(str1 + " it is not a string", error.message)
    }
    

    const myFunc2 = new Function(a2)
    console.log("my func 2 is ", myFunc2)
    console.log(myFunc2.toString(), myFunc2())

} catch (error) {
    console.log("ERROR ", error)
    console.log(error.message)
} 

try {
    // b = new Function("return " + a)
    // console.log(b)
    // console.log("printing b string")
    // console.log(b.toString())
    // console.log("after printing b")

    // c = b()
    // console.log("printing c string")
    // console.log(c)

    /**
     * b = () => {
     *   return () => {
     *     eval("() => { console.log('hey')}")
     *   }
     * }
     */

    /**
     * c = () => {
     *   eval("() => { console.log('hey')}")
     * }
     */

    // check for globals in c before executing c

    // console.log("c is ", c)
    const globals = detect(a)
    console.log("globals is ", globals)

    // console.log("globals is ", globals.map((global) => global.name))
    
    // c()
} catch(error) {
    console.log("catch error ", error)
}



// console.log(b.toString())

// c = b()

// console.log("c is ")

// console.log(c)