import { fn_keys, isValidFunction, validateFunctionsInObject } from "./helpers";

describe("isValidFunction", () => {
    it("returns true if the function doesn't have globals in it", () => {
        // const fn = () => {}
        // const result = isValidFunction(fn, [])
        // expect(result.isValid).toEqual(true)
        // expect(result.parsed).toEqual('() => { }')
        // expect(result.messages).toEqual([])
    })

//     it("returns false if the function has globals in it", () => {
//         const fn = () => { console.log() }

//         const result = isValidFunction(fn, [])
//         expect(result.isValid).toEqual(false)
//         expect(result.parsed).toEqual('')
//         const messages = result.messages?.map((error : Error) => error.message )
//         expect(messages).toEqual(['console is not allowed in functions'])
//     })

//     it("returns true if whitelisted globals are present in the function", () => {
//         const whitelistedGlobals = ["console"]
        
//         const fn = () => { console.log("this is a log statement") }
//         const result = isValidFunction(fn, whitelistedGlobals)
//         expect(result.isValid).toEqual(true)
//         expect(result.parsed).toEqual('() => { console.log(\"this is a log statement\"); }')
//         expect(result.messages).toEqual([])
        
//     })

//     it("returns false if non whitelisted globals are present in the function", () => {
//         const whitelistedGlobals = ["console"]
        
//         let fn : any = async () => { 
//             console.log("this is a log statement");
//         }
//         let result = isValidFunction(fn, whitelistedGlobals)
//         expect(result.isValid).toEqual(false)
//         expect(result.parsed).toEqual('')
        
//         let messages = result.messages?.map((error : Error) => error.message )
//         // async is not allowed in globals
//         expect(messages).toEqual(['tslib_1 is not allowed in functions'])

//         fn = () => {
//             console.log("this is a log statement")
//             fetch("random url")
//         }

//         result = isValidFunction(fn, whitelistedGlobals)
//         expect(result.isValid).toEqual(false)
//         expect(result.parsed).toEqual('')

//         messages = result.messages?.map((error : Error) => error.message )
//         expect(messages).toEqual(['fetch is not allowed in functions'])
//     })
// })

// describe("validationObjectWithFunctions", () => {
//     it("returns true if an object has a valid function", () => {
//         const allowedGlobals : string[] = [ 'console']
//         const obj = {
//             key: "value",
//             "rajat" : () => { console.log("log statement") }
//         }
//         const result = validateFunctionsInObject(obj, allowedGlobals)
//         expect(result.isValid).toEqual(true)
//         expect(result.parsed[__fn_keys__]).toEqual(["fnKey"])
//         expect(result.parsed).toEqual({
//             __fn_keys__: ["rajat"],
//             key: "value",
//             rajat: "() => { console.log(\"log statement\"); }"
//         })
//     })
//     it("returns false if an invalid function is present", () => {
//         const allowedGlobals : string[] = []
//         const obj = {
//             key: "value",
//             fnKey : () => { console.log("log statement") }
//         }
//         const result = validateFunctionsInObject(obj, allowedGlobals)
//         expect(result.isValid).toEqual(false)
//         expect(result.parsed).toEqual({})
//         const messages = result.messages?.map((error : Error) => error.message )
//         expect(messages).toEqual(['console is not allowed in functions'])
//     })
//     it("includes full path of key having a function in the parent object", () => {
//         const allowedGlobals : string[] = []
//         const obj = {
//             key1: "value",
//             key2: {
//                 key3: {
//                     fnKey : () => { }
//                 }
//             }
//         }
//         const result = validateFunctionsInObject(obj, allowedGlobals)
        
//         expect(result.isValid).toEqual(true)
//         expect(result.parsed[__fn_keys__]).toEqual(["key2.key3.fnKey"])
//         expect(result.parsed).toEqual({
//             __fn_keys__: ["key2.key3.fnKey"],
//             key1: "value",
//             key2: {
//                 key3: {
//                     fnKey : "() => { }"
//                 }
//             }
//         })
//     })
//     it("includes an array index if a function is present inside an array", () => {
//         const allowedGlobals : string[] = []
//         const obj = {
//             key1: "value",
//             key2: {
//                 key3: {
//                     key4: ["string1", () => { }, "string3"]
//                 }
//             }
//         }
//         const result = validateFunctionsInObject(obj, allowedGlobals)
        
//         expect(result.isValid).toEqual(true)
//         expect(result.parsed[__fn_keys__]).toEqual(["key2.key3.key4.[1]"])
//         expect(result.parsed).toEqual({
//             __fn_keys__: ["key2.key3.key4.[1]"],
//             key1: "value",
//             key2: {
//                 key3: {
//                     key4: ["string1", "() => { }", "string3"]
//                 }
//             }
//         })
//     })
//     it("includes an array index if a function is present inside a nested object inside an array", () => {
//         const allowedGlobals : string[] = []
//         const obj = {
//             key1: "value",
//             key2: {
//                 key3: {
//                     key4: ["string1", { key5: () => { }, key6: "value" } , "string3"]
//                 }
//             }
//         }
//         const result = validateFunctionsInObject(obj, allowedGlobals)
        
//         expect(result.isValid).toEqual(true)
//         expect(result.parsed[__fn_keys__]).toEqual(["key2.key3.key4.[1].key5"])
//         expect(result.parsed).toEqual({
//             __fn_keys__: ["key2.key3.key4.[1].key5"],
//             key1: "value",
//             key2: {
//                 key3: {
//                     key4: ["string1", { key5: "() => { }", key6: "value" }, "string3"]
//                 }
//             }
//         })
//     })
})
