package com.appsmith.server.constants;

import java.text.MessageFormat;

public enum ImportValidationErrors {
    INVALID_UNPUBLISHED_RESOURCE("Unpublished {0} can't be null. Please check the {1} before import"),
    UNIQUE_UNPUBLISHED_RESOURCE_NAME("Unpublished {0} name should be unique. Please check the {1} before import"),
    UNIQUE_PUBLISHED_RESOURCE_NAME("Published {0} names should be unique. Please check the {1} before import"),
    INVALID_PAGE_BINDING_WITH_COLLECTION("Unable to find page {0} in page list, attached to action collection with name {1}"),
    INVALID_PAGE_BINDING_WITH_ACTION("Unable to find page {0} in page list, attached to action with name {1}"),
    INVALID_COLLECTION_BINDING_WITH_ACTION("Unable to find action collection {0} in collection list, attached to action with name {1}"),
    INVALID_ACTION_BINDING_WITH_ON_LOAD_ACTION("Action referenced for on page load with name {0} is not available in action list. Please check the actions before import"),
    INVALID_COLLECTION_BINDING_WITH_ON_LOAD_ACTION("Action collection referenced for on page load with name {0} is not available in action collection list. Please check the actions before import");

    private final String message;

    ImportValidationErrors(String message, Object... args) {
        MessageFormat fmt = new MessageFormat(message);
        this.message = fmt.format(args);
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }
}
