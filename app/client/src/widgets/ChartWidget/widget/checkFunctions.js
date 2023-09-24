const rajat = "rajat 123"

const c = () => 1
console.log("type of c is ", typeof(c))

const a = () => {
    console.log("rajat is ", rajat)
    function.prototype.constructor = undefined

    const cons = (()=>1).constructor
    console.log("cons is ", cons.toString())
    const fn = () => {
        console.log("second rajat is ", rajat)
    }
    (new ((()=>1).constructor)("rajat"))
    // console.log("fn is ", fn.toString())
    fn()
}
a()
console.log("a function is ", a.toString())