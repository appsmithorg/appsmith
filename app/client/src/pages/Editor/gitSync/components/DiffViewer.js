import { React, useEffect, useState } from "react";
import { calcluateDiff, parseJSONString } from "./DiffUtilities";
import { CodeRenderer } from "./CodeRenderer";

export function DiffViewer(props) {
  props;
  const [jsono, setJSONO] = useState();
  const [jsona, setJSONA] = useState();
  const [jsonb, setJSONB] = useState();

  const [jsonACodeBlocks, setJSONACodeBlocks] = useState();
  const [jsonBCodeBlocks, setJSONBCodeBlocks] = useState();

  const [conflictEvaluated, setConflictEvaluated] = useState();

  const handleFileUpload = (e) => {
    // console.log("upload event is ", e.target.id, e.target.files)
    const inputID = e.target.id;
    if (e.target.files.length > 0) {
      const fileReader = new FileReader();
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        const jsonObject = parseJSONString(JSON.parse(e.target.result));
        if (inputID == "mergebase") {
          setJSONO(jsonObject);
        } else if (inputID == "patcha") {
          setJSONA(jsonObject);
          setJSONACodeBlocks(codeBlocksForJSON(jsonObject));
        } else if (inputID == "patchb") {
          setJSONB(jsonObject);
          // console.log(jsonObject, codeBlocksForJSON(jsonObject));
          setJSONBCodeBlocks(codeBlocksForJSON(jsonObject));
        }

        setConflictEvaluated(false);
      };
    }
  };

  useEffect(() => {
    // console.log("useeffect called conflict evluated ", conflictEvaluated)
    if (!conflictEvaluated && jsona && jsonb && jsono) {
      calculateMergeConflicts();
      setConflictEvaluated(true);
    } else {
      // console.log("coming in else")
    }
  });

  const calculateMergeConflicts = () => {
    // console.log("calculate diff called")

    const results = calcluateDiff({ o: jsono, a: jsona, b: jsonb });
    let jsonACodeBlocksWithConflicts = [];
    let jsonBCodeBlocksWithConflicts = [];

    for (const result of results) {
      if (result.ok) {
        for (const codeblock of result.ok) {
          jsonACodeBlocksWithConflicts.push({
            text: codeblock,
            conflict: false,
          });
          jsonBCodeBlocksWithConflicts.push({
            text: codeblock,
            conflict: false,
          });
        }
      }

      if (result.conflict) {
        const patchAConflictCodeBlock = codeBlockForPatch(result.conflict, "a");
        const patchBConflictCodeBlock = codeBlockForPatch(result.conflict, "b");

        jsonACodeBlocksWithConflicts.push(patchAConflictCodeBlock);
        jsonBCodeBlocksWithConflicts.push(patchBConflictCodeBlock);
      }
    }

    // console.log("result from merge conflict is ", results)
    // console.log("new json a is ", newJSONA)
    // console.log("new json b is ", newJSONB)
    setJSONACodeBlocks(jsonACodeBlocksWithConflicts);
    setJSONBCodeBlocks(jsonBCodeBlocksWithConflicts);
  };

  const codeBlocksForJSON = (json) => {
    const codeblocks = [];
    for (const jsonBlob of json) {
      codeblocks.push({ text: jsonBlob, conflict: false });
    }
    return codeblocks;
  };

  const codeBlockForPatch = (conflict, patchType) => {
    const isAddition = true;
    const isDeletion = false;
    // let text = conflict[patchType].join("\n")

    if (conflict.o.length > 0 && conflict[patchType].length == 0) {
      isDeletion = true;
      isAddition = false;
      // text = conflict.o.join("\n")
    }

    const output = {
      original: conflict.o.join("\n"),
      text: conflict[patchType].join("\n"),
      conflict: true,
      addition: isAddition,
      deletion: isDeletion,
    };
    return output;
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "20px",
      }}
    >
      <div style={{ width: "100%" }}>
        <p style={{ backgroundColor: "red", margin: "0px" }}>GIT DIFF VIEWER</p>
      </div>

      <div style={{ width: "50%" }}>
        <div style={{ width: "50%" }}>
          <label htmlFor="patchb">Select Merge Base</label>
          <input id="mergebase" onChange={handleFileUpload} type="file" />
        </div>
      </div>

      <div style={{ display: "flex", width: "100%" }}>
        <div style={{ width: "50%" }}>
          <label htmlFor="patcha">Select Patch B</label>
          <input id="patcha" onChange={handleFileUpload} type="file" />
          <CodeRenderer blocks={jsonACodeBlocks} name={"Patch 1"} />
        </div>

        <div style={{ width: "50%" }}>
          <label htmlFor="patchb">Select Patch B</label>
          <input id="patchb" onChange={handleFileUpload} type="file" />
          <CodeRenderer blocks={jsonBCodeBlocks} name={"Patch B"} />
        </div>
      </div>
    </div>
  );
}
