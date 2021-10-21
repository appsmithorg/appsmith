import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import Dropdown from "components/ads/Dropdown";
import MenuIcon from "remixicon-react/MenuLineIcon";
import { updateZoomLevel } from "actions/editorActions";
import { getZoomLevel } from "selectors/editorSelectors";
import { setExplorerActive } from "actions/explorerActions";
import DropdownIcon from "remixicon-react/ArrowDownSLineIcon";
import { getExplorerPinned } from "selectors/explorerSelector";

const ZOOM_OPTIONS = [
  {
    label: "100%",
    value: "1",
  },
  { label: "75%", value: "0.75" },
  { label: "50%", value: "0.5" },
  { label: "25%", value: "0.25" },
];

function Toolbar() {
  const dispatch = useDispatch();
  const explorerPinned = useSelector(getExplorerPinned);
  const zoomLevel = useSelector(getZoomLevel);

  /**
   * dispatches an action that updates zoom level
   */
  const onSelectZoom = useCallback(
    (value?: string) => {
      dispatch(updateZoomLevel(value ? parseFloat(value) : 1));
    },
    [dispatch],
  );

  /**
   * on hovering the menu, make the explorer active
   */
  const onMenuHover = useCallback(() => {
    dispatch(setExplorerActive(true));
  }, [setExplorerActive]);

  return (
    <div className="border-b flex items-center justify-between px-2 py-2 z-1">
      <div>
        {explorerPinned === false && (
          <MenuIcon
            className="w-5 h-5 text-trueGray-400 cursor-pointer"
            onMouseEnter={onMenuHover}
          />
        )}
      </div>
      <div className="flex text-sm">
        <Dropdown
          className="zoom-dropdown "
          containerClassName=""
          dropdownTriggerIcon={
            <div className="flex py-1 px-2 w-20 items-center justify-between hover:bg-trueGray-100">
              <span className="text-sm">{(zoomLevel * 100).toFixed(0)}%</span>
              <DropdownIcon className="w-5 h-5 text-trueGray-400" />
            </div>
          }
          height="auto"
          onSelect={onSelectZoom}
          optionWidth="115px"
          options={ZOOM_OPTIONS}
          selected={ZOOM_OPTIONS[0]}
          showLabelOnly
          width="auto"
        />
      </div>
    </div>
  );
}

export default Toolbar;
