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

    for (let i = 0; i < props.listData.length; i++) {
      updatedItems[i] = JSON.parse(JSON.stringify(item));
    }

    updatedItems.map((currentItem, itemIndex) => {
      const widgetKeys = Object.keys(currentItem);

      widgetKeys.map((currentWidgetName) => {
        const currentWidget = currentItem[currentWidgetName];

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
      });
    });

    return updatedItems;
  },
  //
};
