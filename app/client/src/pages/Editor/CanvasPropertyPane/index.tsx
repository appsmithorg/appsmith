import * as Sentry from "@sentry/react";
import React, { useState } from "react";

import { addWrappers, removeWrappers } from "actions/autoLayoutActions";
import { batchUpdateMultipleWidgetProperties } from "actions/controlActions";
import { LayoutDirection, Positioning } from "components/constants";
import { Colors } from "constants/Colors";
import { Dropdown, DropdownOption, RenderOption } from "design-system";
import { useDispatch } from "react-redux";
import { getWidgets } from "sagas/selectors";
import { useSelector } from "store";
import styled from "styled-components";
import { MainContainerLayoutControl } from "../MainContainerLayoutControl";
import ThemeEditor from "../ThemePropertyPane/ThemeEditor";

const Title = styled.p`
  color: ${Colors.GRAY_800};
`;

type Props = {
  skipThemeEditor?: boolean;
};

// const PositioningOptions = () => {
//   const dispatch = useDispatch();
//   const widgets = useSelector(getWidgets);
//   const options: DropdownOption[] = [
//     { label: "Fixed", value: Positioning.Fixed },
//     { label: "Vertical stack", value: Positioning.Vertical },
//   ];
//   const [selectedOption, setSelectedOption] = useState<number>(() => {
//     if (widgets && widgets["0"].positioning) {
//       return options
//         .map((each) => each.value)
//         .indexOf(widgets["0"].positioning);
//     }
//     return 0;
//   });
//   const renderOption: RenderOption = ({
//     isHighlighted,
//     isSelectedNode,
//     option,
//   }) => (
//     <div
//       className={`flex space-x-2  w-full cursor-pointer ${
//         isSelectedNode ? "px-2 py-2" : "px-2 py-2 hover:bg-gray-200"
//       } ${isHighlighted ? "bg-gray-200" : ""}`}
//       onClick={() => {
//         if (!isSelectedNode) {
//           setSelectedOption(options.indexOf(option as DropdownOption));
//           const isVerticalStack =
//             (option as DropdownOption).value === Positioning.Vertical;
//           const widgetId = "0";
//           dispatch(
//             batchUpdateMultipleWidgetProperties([
//               {
//                 widgetId,
//                 updates: {
//                   modify: {
//                     positioning: (option as DropdownOption).value,
//                     useAutoLayout:
//                       (option as DropdownOption).value !== Positioning.Fixed,
//                     direction: isVerticalStack
//                       ? LayoutDirection.Vertical
//                       : LayoutDirection.Horizontal,
//                   },
//                 },
//               },
//             ]),
//           );
//           if (isVerticalStack) dispatch(addWrappers(widgetId));
//           else removeWrappers(widgetId);
//         }
//       }}
//     >
//       <div className="leading-normal">{(option as DropdownOption).label}</div>
//     </div>
//   );
//   return (
//     <section className="space-y-2">
//       <Dropdown
//         options={options}
//         renderOption={renderOption}
//         selected={options[selectedOption]}
//         showLabelOnly
//         width="100%"
//       />
//     </section>
//   );
// };

export function CanvasPropertyPane(props: Props) {
  return (
    <div className="relative ">
      <h3 className="px-4 py-3 text-sm font-medium uppercase">Properties</h3>

      <div className="mt-3 space-y-6">
        <div className="px-4 space-y-2">
          <Title className="text-sm">Canvas Size</Title>
          <MainContainerLayoutControl />
        </div>
        {/* {!props.skipThemeEditor && (
          <div className="px-3 space-y-2">
            <p className="text-sm text-gray-700">Positioning</p>
            <PositioningOptions />
          </div>
        )} */}
        {!props.skipThemeEditor && <ThemeEditor />}
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);
