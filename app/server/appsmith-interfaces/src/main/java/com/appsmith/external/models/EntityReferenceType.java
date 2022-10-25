package com.appsmith.external.models;

public enum EntityReferenceType {
    ACTION, // Queries or APIs
    JSACTION, // Functions inside JS objects
    WIDGET,
    APPSMITH // References inside the appsmith object in the global scope
}
