package com.appsmith.external.models;

public enum EntityReferenceType {
    ACTION, // Queries or APIs
    JSACTION, // Functions inside JS Objects
    WIDGET,
    APPSMITH // References inside the appsmith object in the global scope
}
