import { registerWidgets } from "./WidgetRegistry"

describe("register widgets", () => {
    it("registers the widget as per their configurations", () => {
        const overrides = {}
        const output = registerWidgets(overrides)

        expect(output.filepickerwidget.maxFileSize).toEqual(5)
    })

    it("applies widget configuation overrides if present for a widget", () => {
        const overrides = {
            "FILE_PICKER_WIDGET_V2": {
                maxFileSize: 100
            }
        }
        
        // the organization of the code can be on similar lines below
        const output = registerWidgets(overrides)
        
        // default max file size should get overriden
        expect(output.filepickerwidget.maxFileSize).toEqual(100)
    })
})
