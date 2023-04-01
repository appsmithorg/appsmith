// import classNames from "classnames";
import React, { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import { updateApplicationLayout } from "@appsmith/actions/applicationActions";
import { TooltipComponent } from "design-system-old";
import type {
  AppLayoutConfig,
  SupportedLayouts,
} from "reducers/entityReducers/pageListReducer";
import {
  getCurrentApplicationId,
  getCurrentApplicationLayout,
} from "selectors/editorSelectors";
import { Icon, SegmentedControl } from "design-system";

const StyledSegmentedControl = styled(SegmentedControl)`
  > .ads-v2-segmented-control__segments-container {
    flex: 1 1 0%;
  }
`;

interface AppsmithLayoutConfigOption {
  name: string;
  type: SupportedLayouts;
  icon?: string;
}

export const AppsmithDefaultLayout: AppLayoutConfig = {
  type: "FLUID",
};

const AppsmithLayouts: AppsmithLayoutConfigOption[] = [
  {
    name: "Fluid Width",
    type: "FLUID",
    icon: "fluid",
  },
  {
    name: "Desktop",
    type: "DESKTOP",
    icon: "desktop",
  },
  {
    name: "Tablet (Landscape)",
    type: "TABLET_LARGE",
    icon: "tabletLandscape",
  },
  {
    name: "Tablet (Portrait)",
    type: "TABLET",
    icon: "tablet",
  },
  {
    name: "Mobile Device",
    type: "MOBILE",
    icon: "mobile",
  },
];

const options = AppsmithLayouts.map((layout, index) => ({
  label: (
    <TooltipComponent
      className="flex-grow"
      content={layout.name}
      key={layout.name}
      position={
        index === AppsmithLayouts.length - 1 ? "bottom-right" : "bottom"
      }
    >
      <Icon name={layout.icon} size="md" />
    </TooltipComponent>
  ),
  value: layout.type,
}));

export function MainContainerLayoutControl() {
  const dispatch = useDispatch();
  const appId = useSelector(getCurrentApplicationId);
  const appLayout = useSelector(getCurrentApplicationLayout);

  // const buttonRefs: Array<HTMLButtonElement | null> = [];

  /**
   * return selected layout index. if there is no app
   * layout, use the default one ( fluid )
   */
  // const selectedIndex = useMemo(() => {
  //   return AppsmithLayouts.findIndex(
  //     (each) => each.type === (appLayout?.type || AppsmithDefaultLayout.type),
  //   );
  // }, [appLayout]);

  // const [focusedIndex, setFocusedIndex] = React.useState(selectedIndex);

  /**
   * updates the app layout
   *
   * @param layoutConfig
   */
  const updateAppLayout = useCallback(
    (type: string) => {
      dispatch(
        updateApplicationLayout(appId || "", {
          appLayout: {
            // @ts-expect-error: Type error
            type,
          },
        }),
      );
    },
    [dispatch, appLayout],
  );

  // const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
  //   if (!buttonRefs.length) return;

  //   switch (event.key) {
  //     case "ArrowRight":
  //     case "Right":
  //       const rightIndex = index === buttonRefs.length - 1 ? 0 : index + 1;
  //       buttonRefs[rightIndex]?.focus();
  //       setFocusedIndex(rightIndex);
  //       break;
  //     case "ArrowLeft":
  //     case "Left":
  //       const leftIndex = index === 0 ? buttonRefs.length - 1 : index - 1;
  //       buttonRefs[leftIndex]?.focus();
  //       setFocusedIndex(leftIndex);
  //       break;
  //   }
  // };

  // return (
  //   <div className="pb-6 space-y-2 t--layout-control-wrapper">
  //     <div
  //       className="flex justify-around"
  //       onBlur={() => setFocusedIndex(selectedIndex)}
  //     >
  //       {AppsmithLayouts.map((layoutOption: any, index: number) => {
  //         return (
  //           <TooltipComponent
  //             className="flex-grow"
  //             content={layoutOption.name}
  //             key={layoutOption.name}
  //             position={
  //               index === AppsmithLayouts.length - 1 ? "bottom-right" : "bottom"
  //             }
  //           >
  //             {/* TODO (tanvi): Is this a toggle button? */}
  //             <button
  //               className={classNames({
  //                 "border-transparent border flex items-center justify-center p-2 flex-grow  focus:bg-gray-200":
  //                   true,
  //                 "bg-white border-gray-300": selectedIndex === index,
  //                 "bg-gray-100 hover:bg-gray-200": selectedIndex !== index,
  //               })}
  //               onClick={() => {
  //                 updateAppLayout(layoutOption);
  //                 setFocusedIndex(index);
  //               }}
  //               onKeyDown={(event) => handleKeyDown(event, index)}
  //               ref={(input) => buttonRefs.push(input)}
  //               tabIndex={index === focusedIndex ? 0 : -1}
  //             >
  //               <Icon name={layoutOption.icon} size="md" />
  //             </button>
  //           </TooltipComponent>
  //         );
  //       })}
  //     </div>
  //   </div>
  // );

  return (
    <div className="pb-6 space-y-2 t--layout-control-wrapper">
      <StyledSegmentedControl
        defaultValue={appLayout.type}
        // @ts-expect-error: Type error
        onChange={updateAppLayout}
        options={options}
      />
    </div>
  );
}
