/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getSelectedItem: (props, moment, _) => {
    const selectedItemIndex =
      props.selectedItemIndex === undefined ||
      Number.isNaN(parseInt(props.selectedItemIndex))
        ? -1
        : parseInt(props.selectedItemIndex);
    const items = props.listData || [];

    if (selectedItemIndex === -1) {
      const emptyRow = { ...items[0] };
      Object.keys(emptyRow).forEach((key) => {
        emptyRow[key] = "";
      });
      return emptyRow;
    }

    const selectedItem = { ...items[selectedItemIndex] };
    return selectedItem;
  },
  // Patch #12438 - hard-coded DEFAULT_GRID_ROW_HEIGHT(parentRowSpace) for calculating template/component height. Ideally it should be dynamic based on props.
  getPageSize: (props, moment, _) => {
    const LIST_WIDGET_PAGINATION_HEIGHT = 36;
    const DEFAULT_GRID_ROW_HEIGHT = 10;
    const WIDGET_PADDING = DEFAULT_GRID_ROW_HEIGHT * 0.4;
    const itemsCount = (props.listData || []).length;

    let gridGap = 0;
    try {
      gridGap = parseInt(props.gridGap);

      if (!_.isNumber(props.gridGap) || _.isNaN(props.gridGap)) {
        gridGap = 0;
      }
    } catch {
      gridGap = 0;
    }

    gridGap = gridGap >= -8 ? gridGap : 0;

    const averageGridGap = itemsCount
      ? gridGap * ((itemsCount - 1) / itemsCount)
      : 0;

    const templateBottomRow = props.templateBottomRow;
    const templateHeight = templateBottomRow * DEFAULT_GRID_ROW_HEIGHT;
    const componentHeight =
      (props.bottomRow - props.topRow) * DEFAULT_GRID_ROW_HEIGHT;

    const spaceAvailableWithoutPaginationControls =
      componentHeight - WIDGET_PADDING * 2;
    const spaceAvailableWithPaginationControls =
      spaceAvailableWithoutPaginationControls - LIST_WIDGET_PAGINATION_HEIGHT;

    const spaceTakenByOneContainer = templateHeight + averageGridGap;
    const spaceTakenByAllContainers = spaceTakenByOneContainer * itemsCount;
    const paginationControlsEnabled =
      spaceTakenByAllContainers > spaceAvailableWithoutPaginationControls ||
      props.serverSidePaginationEnabled;

    const totalAvailableSpace = paginationControlsEnabled
      ? spaceAvailableWithPaginationControls
      : spaceAvailableWithoutPaginationControls;

    const pageSize = totalAvailableSpace / spaceTakenByOneContainer;

    return _.isNaN(pageSize) ? 0 : _.floor(pageSize);
  },
  //
  // this is just a patch for #7520
  getChildAutoComplete: (props, moment, _) => {
    const data = [...props.listData];

    const structure =
      Array.isArray(data) && data.length > 0
        ? Object.assign(
            {},
            ...Object.keys(data[0]).map((key) => ({
              [key]: "",
            })),
          )
        : {};
    return { currentItem: structure, currentIndex: "" };
  },
  //
};
