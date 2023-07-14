import { React, useEffect, useState } from "react";
import { calcluateDiff, parseJSONString } from "./DiffUtilities";
import { CodeRenderer } from "./CodeRenderer";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getResolvedConflicts } from "selectors/gitSyncSelectors";

export function DiffViewer({ filePath }) {
  const filename = filePath.split("/").pop();
  const dispatch = useDispatch();
  const [jsono, setJSONO] = useState();
  const [jsona, setJSONA] = useState();
  const [jsonb, setJSONB] = useState();

  const [jsonACodeBlocks, setJSONACodeBlocks] = useState();
  const [jsonBCodeBlocks, setJSONBCodeBlocks] = useState();
  const resolvedConflicts = useSelector(getResolvedConflicts);
  const [conflictEvaluated, setConflictEvaluated] = useState();

  let currFileConflicts = { a: [], b: [] };
  useEffect(() => {
    if (resolvedConflicts?.[filename].length > 0 && jsonBCodeBlocks) {
      const updatedJsonBCodeBlocks = [...jsonBCodeBlocks];
      resolvedConflicts[filename].forEach((patch) => {
        const index = patch.lineNumber - 1;
        if (index >= 0 && index < updatedJsonBCodeBlocks.length) {
          updatedJsonBCodeBlocks[index] = patch;
        }
      });
      setJSONBCodeBlocks(updatedJsonBCodeBlocks);
      dispatch({
        type: ReduxActionTypes.SET_RESOLVED_DSL_ARRAY,
        payload: {
          [filePath]: [...updatedJsonBCodeBlocks.map((block) => block.text)],
        },
      });
    }
  }, [resolvedConflicts]);

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

    let lineNumberA = 1;
    let lineNumberB = 1;
    let counterA = 0;
    let counterB = 0;
    results.forEach((result, index) => {
      let conflictId = `${index}-conflict`;
      if (result.ok) {
        for (const codeblock of result.ok) {
          jsonACodeBlocksWithConflicts.push({
            text: codeblock,
            conflict: false,
            lineNumber: lineNumberA + counterA,
            id: "patcha-" + lineNumberA,
          });
          jsonBCodeBlocksWithConflicts.push({
            text: codeblock,
            conflict: false,
            lineNumber: lineNumberB + counterB,
            id: "patchb-" + lineNumberB,
          });
          lineNumberA += 1;
          lineNumberB += 1;
        }
      }

      if (result.conflict) {
        const patchAConflictCodeBlock = codeBlockForPatch(
          result.conflict,
          "a",
          lineNumberA,
          conflictId + "-a",
        );

        const patchBConflictCodeBlock = codeBlockForPatch(
          result.conflict,
          "b",
          lineNumberB,
          conflictId + "-b",
        );

        lineNumberA += 1;
        lineNumberB += 1;
        jsonACodeBlocksWithConflicts.push(patchAConflictCodeBlock);
        jsonBCodeBlocksWithConflicts.push(patchBConflictCodeBlock);

        currFileConflicts.a.push({
          lineId: patchAConflictCodeBlock.id,
          conflictId: patchAConflictCodeBlock.conflictId,
        });
        currFileConflicts.b.push({
          lineId: patchBConflictCodeBlock.id,
          conflictId: patchBConflictCodeBlock.conflictId,
        });

        // if (patchAConflictCodeBlock.text.split("\n").length > 1) {
        //   counterA += patchAConflictCodeBlock.text.split("\n").length - 1;
        // } else {
        //   counterA = 0;
        // }

        // if (patchBConflictCodeBlock.text.split("\n").length > 1) {
        //   counterB += patchBConflictCodeBlock.text.split("\n").length - 1;
        // } else {
        //   counterB = 0;
        // }
      }
    });

    // console.log("result from merge conflict is ", results)
    // console.log("new json b is ", newJSONB)
    setJSONACodeBlocks(jsonACodeBlocksWithConflicts);
    setJSONBCodeBlocks(jsonBCodeBlocksWithConflicts);
    if (currFileConflicts) {
      dispatch({
        type: ReduxActionTypes.SET_CURRENT_FILE_CONFLICTS,
        payload: currFileConflicts,
      });
    }
  };

  const codeBlocksForJSON = (json) => {
    const codeblocks = [];
    for (const [index, jsonBlob] of json.entries()) {
      codeblocks.push({
        text: jsonBlob,
        conflict: false,
        lineNumber: index + 1,
      });
    }
    return codeblocks;
  };

  const codeBlockForPatch = (conflict, patchType, lineNumber, conflictId) => {
    const isAddition = true;
    const isDeletion = false;
    let text = conflict[patchType].join("\n");

    if (conflict.o.length > 0 && conflict[patchType].length == 0) {
      isDeletion = true;
      isAddition = false;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      text = conflict.o.join("\n");
    }

    const output = {
      original: conflict.o.join("\n"),
      text: conflict[patchType].join("\n"),
      conflict: true,
      addition: isAddition,
      deletion: isDeletion,
      lineNumber: lineNumber,
      patch: patchType,
      id: `patch${patchType}-` + lineNumber,
      conflictId,
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
          <label htmlFor="patcha">Select Patch A</label>
          <input id="patcha" onChange={handleFileUpload} type="file" />
          <CodeRenderer blocks={jsonACodeBlocks} name={filename} />
        </div>

        <div style={{ width: "50%" }}>
          <label htmlFor="patchb">Select Patch B</label>
          <input id="patchb" onChange={handleFileUpload} type="file" />
          <CodeRenderer blocks={jsonBCodeBlocks} name={filename} />
        </div>
      </div>
    </div>
  );
}
