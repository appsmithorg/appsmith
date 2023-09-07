const findKey = (obj, id) => {
    // console.log("find key called for obj ", JSON.stringify(obj))
    if (typeof(obj) !== "object") {
        return null;
    }

    // console.log("obj.id is ", obj.id, " id is ", id)
    if (obj.id == id) {
        // console.log("coming in if")
        return obj
    } else {
        const keys = Object.keys(obj)
        // console.log("keys is ", keys)
        for (const key of keys) {
            // console.log("calling find key for ", obj[key])
            const result = findKey(obj[key], id)
            // console.log("result for obj ", JSON.stringify(obj[key]), " is ", result)
            if (result) {
                return result
            }
        }
        return null
    }
}

const obj = {
    a: "a",
    b: {
        c: {
            id: "abc"
        } 
    },
}

const myFun = () => { console.log("hey") }
const myFunString = myFun.toString()
// console.log("my func string is ", myFunString)

const evaluatedFunc = new Function(myFunString)
// console.log("evaluated func is ", evaluatedFunc)
evaluatedFunc()

const output = findKey(obj, "abc")
// console.log("output is ", output)




const values = [1,2,3]
const assignFunc = (new Function("return " + `(value, params) => {
                return ${JSON.stringify(values)}[params.dataIndex]
            }
          `))()
// console.log("***", "assign func is ", assignFunc.toString())