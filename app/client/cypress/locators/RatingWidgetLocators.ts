// export rating widget selectors
export const RATING_WIDGET = {
    ratingwidget :"//*[contains(@data-testid,'t--centered-Rating1')]",
    star_icon : ".bp3-icon-star",
    star_icon_filled : (width) => `//span[contains(@style,'width: ${width}%')]`,
    allowhalfstars:".t--property-control-allowhalfstars input",
    visible: ".t--property-control-visible input",
    disabled: ".t--property-control-disabled input",
    readonly: ".t--property-control-readonly input",
    popover:".bp3-popover-target.bp3-popover-open",
    onChangeAddButton: ".t--add-action-onChange .ads-v2-button__content"
}

