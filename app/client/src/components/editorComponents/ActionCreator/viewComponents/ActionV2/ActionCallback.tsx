export default {};
// import TreeStructure from "components/utils/TreeStructure";
// import { Icon } from "design-system-old";
// import React from "react";
// import { TActionBlock } from "../../types";

// export function ActionCallback({ action }: { action: TActionBlock }) {
//   const [callbacksExpanded, setCallbacksExpanded] = React.useState(false);

//   const callbackBlocks = [
//     {
//       label: "On success",
//       handleAddBlock: handleAddSuccessBlock,
//       callbacks: successBlocks,
//       blockType: "success",
//       tooltipContent:
//         "Show a message, chain other Actions, or both when the parent Action block runs successfully. All nested Actions run at the same time.",
//     },
//     {
//       label: "On failure",
//       handleAddBlock: handleAddErrorBlock,
//       callbacks: errorBlocks,
//       blockType: "failure",
//       tooltipContent:
//         "Show a message, chain Actions, or both when the parent Action block fails to run. All nested Actions run at the same time.",
//     },
//   ];
//   return (
//     <>
//       {showCallbacks && areCallbacksApplicable ? (
//         <button
//           className="flex w-full justify-between bg-gray-50 px-2 py-1 border-[1px] border-gray-200 border-t-transparent"
//           onClick={() => setCallbacksExpanded((prev) => !prev)}
//         >
//           <span className="text-gray-800 underline underline-offset-2 decoration-dashed decoration-gray-300">
//             Callbacks
//           </span>
//           <div className="flex gap-1">
//             <span className="text-gray-800">
//               {actionsCount > 0 ? actionsCount : "No"} actions
//             </span>
//             <Icon
//               fillColor="var(--ads-color-gray-700)"
//               name={callbacksExpanded ? "expand-less" : "expand-more"}
//               size="extraLarge"
//             />
//           </div>
//         </button>
//       ) : null}
//       {callbacksExpanded && areCallbacksApplicable ? (
//         <TreeStructure>
//           <ul className="tree flex flex-col gap-0">
//             {callbackBlocks.map(
//               ({
//                 blockType,
//                 callbacks,
//                 handleAddBlock,
//                 label,
//                 tooltipContent,
//               }) => (
//                 <li key={label}>
//                   <div className="flex flex-col">
//                     <button
//                       className={clsx(
//                         "action-callback-add",
//                         "flex justify-between bg-gray-50 border-[1px] border-gray-200 box-border",
//                         callbacks.length
//                           ? "border-b-0"
//                           : "border-b-[1px] border-b-gray-200",
//                         // isNewActionSelected(blockType) && "selected",
//                       )}
//                       onClick={handleAddBlock}
//                     >
//                       <TooltipComponent
//                         boundary="viewport"
//                         content={tooltipContent}
//                         popoverClassName="!max-w-[300px]"
//                       >
//                         <span className="text-gray-800 underline underline-offset-2 decoration-dashed decoration-gray-300 px-2 py-1">
//                           {label}
//                         </span>
//                       </TooltipComponent>
//                       <span className="icon w-7 h-7 flex items-center justify-center">
//                         <Icon
//                           fillColor="var(--ads-color-black-700)"
//                           name="plus"
//                           size="extraLarge"
//                         />
//                       </span>
//                     </button>
//                     {callbacks.map((cActionBlock, index) => (
//                       <ActionV2
//                         actionBlock={cActionBlock}
//                         className={`${index === 0 ? "" : "mt-1"}`}
//                         id={`${id}_${blockType}_${index}`}
//                         key={`${id}_${blockType}_${index}`}
//                         onChange={(childActionBlock) => {
//                           const newActionBlock = klona(actionBlock);
//                           if (blockType === "failure") {
//                             newActionBlock.errorBlocks[
//                               index
//                             ] = childActionBlock;
//                           } else {
//                             newActionBlock.successBlocks[
//                               index
//                             ] = childActionBlock;
//                           }
//                           props.onChange(newActionBlock);
//                         }}
//                       />
//                     ))}
//                   </div>
//                 </li>
//               ),
//             )}
//           </ul>
//         </TreeStructure>
//       ) : null}
//     </>
//   );
// }
