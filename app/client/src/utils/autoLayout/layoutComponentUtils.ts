import AlignedRow from "components/designSystems/appsmith/autoLayout/layoutComponents/AlignedRow";
import Column from "components/designSystems/appsmith/autoLayout/layoutComponents/Column";
import Row from "components/designSystems/appsmith/autoLayout/layoutComponents/Row";

export function getLayoutComponent(type: string): any {
  const map: { [id: string]: any } = {
    ALIGNED_ROW: AlignedRow,
    COLUMN: Column,
    ROW: Row,
  };
  return map[type];
}

// export function segregateChildrenIntoLayouts(
//   layout: LayoutComponentProps[],
//   children: { [id: string]: ReactNode | JSX.Element },
// ) {
//   for (const each of layout) {
//     if (each.rendersWidgets) {
//       const eachChildren: { [id: string]: ReactNode | JSX.Element } = {};
//       const layout: string[] | string[][] = each.layout as
//         | string[]
//         | string[][];
//       if (layout.length && typeof layout[0] === "string") {
//         (layout as string[]).forEach((id: string) => {
//           eachChildren[id] = children[id];
//         });
//       } else {
//         (layout as string[][]).forEach((row: string[]) => {
//           row.forEach((id: string) => {
//             eachChildren[id] = children[id];
//           });
//         });
//       }
//     }

//   }
// }
