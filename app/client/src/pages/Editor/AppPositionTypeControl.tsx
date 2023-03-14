import classNames from "classnames";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { ReactComponent as DesktopIcon } from "assets/icons/ads/app-icons/monitor-alt.svg";
import { ReactComponent as MultiDeviceIcon } from "assets/icons/ads/app-icons/monitor-smartphone-alt.svg";
import { Colors } from "constants/Colors";
import { IconName, TooltipComponent } from "design-system-old";
import {
  AppPositioningTypeConfig,
  AppPositioningTypes,
} from "reducers/entityReducers/pageListReducer";
import {
  getCurrentApplicationId,
  getCurrentAppPositioningType,
  isAutoLayoutEnabled,
} from "selectors/editorSelectors";
import { MainContainerLayoutControl } from "./MainContainerLayoutControl";
import { updateApplication } from "actions/applicationActions";
interface ApplicationPositionTypeConfigOption {
  name: string;
  type: AppPositioningTypes;
  icon?: IconName;
}
const IconObj: any = {
  fluid: <MultiDeviceIcon />,
  desktop: <DesktopIcon />,
};
export const AppsmithDefaultPositionType: AppPositioningTypeConfig = {
  type: AppPositioningTypes.FIXED,
};

const AppsmithLayoutTypes: ApplicationPositionTypeConfigOption[] = [
  {
    name: "Fixed Layout",
    type: AppPositioningTypes.FIXED,
    icon: "desktop",
  },
  {
    name: "Auto Layout",
    type: AppPositioningTypes.AUTO,
    icon: "fluid",
  },
];

export const Title = styled.p`
  color: ${Colors.GRAY_800};
`;

export const AppPositionTypeControl = () => {
  const dispatch = useDispatch();
  const buttonRefs: Array<HTMLButtonElement | null> = [];
  const selectedOption = useSelector(getCurrentAppPositioningType);
  const isAutoLayoutActive = useSelector(isAutoLayoutEnabled);
  const appId = useSelector(getCurrentApplicationId);
  /**
   * return selected layout index. if there is no app
   * layout, use the default one ( fluid )
   */
  const selectedIndex = useMemo(() => {
    return AppsmithLayoutTypes.findIndex(
      (each) =>
        each.type === (selectedOption || AppsmithDefaultPositionType.type),
    );
  }, [selectedOption]);

  const [focusedIndex, setFocusedIndex] = React.useState(selectedIndex);

  useEffect(() => {
    if (!isAutoLayoutActive && selectedOption !== AppPositioningTypes.FIXED) {
      /**
       * if feature flag is disabled, set the layout to fixed.
       */
      updateAppPositioningLayout(AppsmithLayoutTypes[0]);
    }
  }, [isAutoLayoutActive]);

  const updateAppPositioningLayout = (
    layoutOption: ApplicationPositionTypeConfigOption,
  ) => {
    dispatch(
      updateApplication(appId || "", {
        appPositioning: {
          type: layoutOption.type,
        },
      }),
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (!buttonRefs.length) return;

    switch (event.key) {
      case "ArrowRight":
      case "Right":
        const rightIndex = index === buttonRefs.length - 1 ? 0 : index + 1;
        buttonRefs[rightIndex]?.focus();
        setFocusedIndex(rightIndex);
        break;
      case "ArrowLeft":
      case "Left":
        const leftIndex = index === 0 ? buttonRefs.length - 1 : index - 1;
        buttonRefs[leftIndex]?.focus();
        setFocusedIndex(leftIndex);
        break;
    }
  };

  return (
    <>
      {isAutoLayoutActive ? (
        <>
          <Title className="text-sm">App Positioning Type</Title>
          <div className="pb-6 space-y-2 t--layout-control-wrapper">
            <div
              className="flex justify-around"
              onBlur={() => setFocusedIndex(selectedIndex)}
            >
              {AppsmithLayoutTypes.map((layoutOption: any, index: number) => {
                return (
                  <TooltipComponent
                    className="flex-grow"
                    content={layoutOption.name}
                    key={layoutOption.name}
                    position={
                      index === AppsmithLayoutTypes.length - 1
                        ? "bottom-right"
                        : "bottom"
                    }
                  >
                    <button
                      className={classNames({
                        "border-transparent border flex items-center justify-center p-2 flex-grow  focus:bg-gray-200": true,
                        "bg-white border-gray-300": selectedIndex === index,
                        "bg-gray-100 hover:bg-gray-200":
                          selectedIndex !== index,
                      })}
                      onClick={() => {
                        updateAppPositioningLayout(layoutOption);
                        setFocusedIndex(index);
                      }}
                      onKeyDown={(event) => handleKeyDown(event, index)} //TODO: Ashok - This event listener isn't being removed.
                      ref={(input) => buttonRefs.push(input)}
                      tabIndex={index === focusedIndex ? 0 : -1}
                    >
                      <div style={{ width: "16px", height: "16px" }}>
                        {IconObj[layoutOption.icon]}
                      </div>
                    </button>
                  </TooltipComponent>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
      {selectedOption === AppPositioningTypes.FIXED && (
        <>
          <Title className="text-sm">Canvas Size</Title>
          <MainContainerLayoutControl />
        </>
      )}
    </>
  );
};

AppPositionTypeControl.whyDidYouRender = {
  logOnDifferentValues: true,
};
