import * as Sentry from "@sentry/react";
import { Colors } from "constants/Colors";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { MainContainerLayoutControl } from "../MainContainerLayoutControl";

import { PopoverPosition } from "@blueprintjs/core";
import { openAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import { Button, Category, Size, TooltipComponent } from "design-system";

const Title = styled.p`
  color: ${Colors.GRAY_800};
`;

// export function CanvasPropertyPane() {
//   const dispatch = useDispatch();

//   const openAppSettingsPane = () => {
//     dispatch(openAppSettingsPaneAction());
//   };

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

export function CanvasPropertyPane() {
  const dispatch = useDispatch();

  const openAppSettingsPane = () => {
    dispatch(openAppSettingsPaneAction());
  };
  return (
    <div className="relative ">
      <h3 className="px-4 py-3 text-sm font-medium uppercase">Properties</h3>

      <div className="mt-3 space-y-6">
        <div className="px-4 space-y-2">
          <Title className="text-sm">Canvas Size</Title>
          <MainContainerLayoutControl />

          <TooltipComponent
            content={
              <>
                <p className="text-center">Update your app theme, URL</p>
                <p className="text-center">and other settings</p>
              </>
            }
            position={PopoverPosition.BOTTOM}
          >
            <Button
              category={Category.secondary}
              fill
              id="t--app-settings-cta"
              onClick={openAppSettingsPane}
              size={Size.medium}
              text="App Settings"
            />
          </TooltipComponent>
        </div>
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);
