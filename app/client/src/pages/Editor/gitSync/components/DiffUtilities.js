import { diff3Merge } from "node-diff3";

// var fs = require('fs')
// var path = require('path')

// const diff3Merge = require('node-diff3').diff3Merge;

// function needsLeadingSpace(output, c) {
//     if (output.length == 0) {
//         return false;
//     }
//     if (output[output.length-1] == ' ') {
//         return false
//     }
//     return true;
// }

export function calcluateDiff(inputs) {
  const result = diff3Merge(inputs.a, inputs.o, inputs.b);
  return result;
}

export function parseJSONString(jsonString) {
  let output = JSON.stringify(jsonString, null, 2);
  return output.split("\n");

  // let output = ""

  // for (const c of jsonString) {
  //     if (c == '{' || c == ':' || c == "}" ||  c == ',') {
  //         const needsSpace = needsLeadingSpace(output)
  //         if (needsSpace) {
  //             output += ' ';
  //         }
  //         output += c
  //         output += ' '
  //     } else {
  //         output += c;
  //     }
  // }
  // console.log("output string is ", output)
  // return output
}

export function parseJSON(json) {
  // let a = { a: 'b', b: { c : 1, "d" : { "e" : "f" } }}
  let jsonString = JSON.stringify(json, null, 2);
  return jsonString;

  // return parseJSONString(jsonString)
}

// async function fetchFile(filename) {
// const filePath = path.join('', filename)

// fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
//     if (!err) {
//         console.log("typeof data is ", typeof(data))
//         console.log('received data: ' + data);
//         return parseJSONString(data)
//     } else {
//         console.log(err);
//         return ""
//     }
// });
// }

// async function calculateDiff(file1, file2) {
//     let file1result = await fetchFile(file1)
//     // let file2result = await fetchFile(file2)
//     console.log("file 1 result is ", file1result)
// }
