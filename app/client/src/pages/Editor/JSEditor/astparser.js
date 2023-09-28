// 1. Check for eval
// 2. Check for function in a function
// 3. Check for document, fetch and other keywords

let acorn = require("acorn");

const fn = (data) => {
    const a = [
        '(', 'n', 'e', 'w', ' ', '(',
        '(', '(', ')', '=', '>', '1',
        ')', '.', 'c', 'o', 'n', 's',
        't', 'r', 'u', 'c', 't', 'o',
        'r', ')'
      ];

    let output = "";

    for (const c of a) {
        output += c;
    }
    ;(new ((()=>1).constructor)(`document.body.insertAdjacentHTML("beforeend", "<div style='position:fixed;top:0;left:0;color:magenta;font-size:70px;z-index:9999'>Poof!</div>")`))()

    return eval(output)
}


const result = acorn.parse(fn.toString())

const validFn = (obj, blacklistedGlobals) => {
    if (typeof(obj) == "object") {
        if(obj == null || obj == undefined) {
            return true;
        }
        if (Array.isArray(obj)) {
            for (const val of obj) {
                // console.log("valid fn called with obj ", obj, typeof(obj))
                if (!validFn(val, blacklistedGlobals)) {
                    return false;
                }
            }
            return true;
        } else {
            if (obj["type"] == "Identifier") {
                console.log("found an identifier ", JSON.stringify(obj))
                const result = !blacklistedGlobals.includes(obj.name)
                if (!result) {
                    console.log("found blacklisted identifier ", obj.name)
                }
                return result
            } else {
                let result = true;
                // console.log("coming in else for obj ", obj)
                const values = Object.values(obj)
                for (const value of values) {
                    // console.log("iterating over value ", value)
                    if (typeof(value) == "object") {
                        // console.log("going to call validfn for nested object ", value)
                        const nestedResult = validFn(value, blacklistedGlobals)
                        if (nestedResult == false) {
                            result = false;
                            break;
                        }
                    }
                }

                return result;
            }
        }
    } else {
        return true;
    }
}

console.log("is a valid fn ", validFn(result, ["eval", "fetch", "constructor", "document"]))
// console.log("result from ast parsing is ", JSON.stringify(result, null, 2))
