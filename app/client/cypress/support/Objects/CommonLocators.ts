export class CommonLocators {

    _addEntityAPI = ".datasources .t--entity-add-btn"
    _integrationCreateNew = "[data-cy=t--tab-CREATE_NEW]"
    _loading = "#loading"
    _actionName = ".t--action-name-edit-field span"
    _actionTxt = ".t--action-name-edit-field input"
    _entityNameInExplorer = (entityNameinLeftSidebar: string) => "//div[contains(@class, 't--entity-name')][text()='" + entityNameinLeftSidebar + "']"
    _homeIcon = ".t--appsmith-logo"
    _homePageAppCreateBtn = ".t--applications-container .createnew"
    _saveStatusSuccess = ".t--save-status-success"
    _codeMirrorTextArea = ".CodeMirror textarea"
    _entityExplorersearch = "#entity-explorer-search"
    _propertyControl = ".t--property-control-"
    _textWidget = ".t--draggable-textwidget span"
    _publishButton = ".t--application-publish-btn"
    _textWidgetInDeployed = ".t--widget-textwidget span"
    _backToEditor = ".t--back-to-editor"
}