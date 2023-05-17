export function getBindingTemplate(widgetName: string) {
  return {
    prefixTemplate: `{{${widgetName}.listData.map((currentItem, currentIndex) =>`,
    suffixTemplate: `)}}`,
  };
}
