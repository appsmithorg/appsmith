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
  //
  getItems: (props, moment, _) => {
    let item = {};

    Object.keys(props.template).map((widgetName) => {
      item[widgetName] = { ...props.template[widgetName] };
    });

    let updatedItems = [];

    for (let itemIndex = 0; itemIndex < props.listData.length; itemIndex++) {
      let currentItem = JSON.parse(JSON.stringify(item));
      const widgetKeys = Object.keys(currentItem);

      for (let i = 0; i < widgetKeys.length; i++) {
        const currentWidgetName = widgetKeys[i];
        let currentWidget = currentItem[currentWidgetName];
        const filteredWidget = {};

        const dynamicPaths = _.compact(
          currentWidget.dynamicBindingPathList?.map((path) => path.key),
        );

        dynamicPaths.forEach((path) => {
          const evaluatedProperty = _.get(
            props.template,
            currentWidget.widgetName + "." + path,
          );

          if (Array.isArray(evaluatedProperty)) {
            const evaluatedValue = evaluatedProperty[itemIndex];

            _.set(currentWidget, path, evaluatedValue);
          }
        });

        if (props.childrenDefaultPropertiesMap) {
          Object.keys(props.childrenDefaultPropertiesMap).map((key) => {
            const defaultKey = props.childrenDefaultPropertiesMap[key];
            const widgetName = key.split(".").shift();

            if (widgetName === currentWidget.widgetName) {
              const defaultPropertyValue = _.get(
                props.template,
                currentWidget.widgetName + "." + defaultKey,
                undefined,
              );

              if (Array.isArray(defaultPropertyValue)) {
                const evaluatedValue = defaultPropertyValue[itemIndex];

                _.set(currentWidget, key.split(".").pop(), evaluatedValue);
              } else if (defaultPropertyValue) {
                _.set(
                  currentWidget,
                  key.split(".").pop(),
                  defaultPropertyValue,
                );
              }
            }
          });
        }

        const metaProperties = _.get(
          props.childMetaProperties,
          currentWidget.widgetName,
          {},
        );

        Object.keys(metaProperties).map((key) => {
          const metaPropertyValue = _.get(
            metaProperties,
            key + "." + itemIndex,
            undefined,
          );

          if (typeof metaPropertyValue !== "undefined") {
            _.set(currentWidget, key, metaPropertyValue);
          }
        });

        if (props.childrenEntityDefinitions) {
          currentItem[currentWidgetName] = _.pick(
            currentWidget,
            props.childrenEntityDefinitions[currentWidget.type],
          );
        }
      }

      updatedItems[itemIndex] = currentItem;
    }

    return updatedItems;
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
