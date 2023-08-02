import { fetchPlatformWidgetConfigurationOverrides } from "./WidgetPlatformOverrides"

describe("fetchPlatformWidgetConfigurationOverrides", () => {
    it("fetches the correct widget configuration overrides for Appsmith platform", () => {
        const expectedOverrides = {
            "FILE_PICKER_WIDGET_V2" : {
                maxFileSize: 100
                }
        }
        const overrides = fetchPlatformWidgetConfigurationOverrides()
        expect(overrides).toEqual(expectedOverrides)
    })
})