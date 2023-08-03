// export rating widget selectors
export const RATING_WIDGET = {
    ratingwidget :"//*[contains(@data-testid,'t--centered-Rating1')]",
    star_icon : ".bp3-icon-star",
    star_icon_filled : (width: any) => `//span[contains(@style,'width: ${width}%')]`
}

