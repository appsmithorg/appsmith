package com.external.plugins;

public enum Method {
    GET_DOCUMENT(true, false),
    GET_COLLECTION(false, false),
    SET_DOCUMENT(true, false),
    CREATE_DOCUMENT(true, false),
    ADD_TO_COLLECTION(false, false),
    UPDATE_DOCUMENT(true, false),
    DELETE_DOCUMENT(true, false),
    ;

    private final boolean isDocumentLevel;
    private final boolean isBodyNeeded;

    Method(boolean isDocumentLevel, boolean isBodyNeeded) {
        this.isDocumentLevel = isDocumentLevel;
        this.isBodyNeeded = isBodyNeeded;
    }

    public boolean isDocumentLevel() {
        return isDocumentLevel;
    }

    public boolean isBodyNeeded() {
        return isBodyNeeded;
    }
}
