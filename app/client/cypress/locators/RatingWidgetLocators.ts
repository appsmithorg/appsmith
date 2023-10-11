// export rating widget selectors
export const RATING_WIDGET = {
    ratingWidgetName : ".t--draggable-ratewidget .t--widget-name",
    ratingwidget :"//*[contains(@data-testid,'t--centered-Rating1')]",
    star_icon : ".bp3-icon-star",
    star_icon_filled : (width: any) => `//span[contains(@style,'width: ${width}%')]`
}

