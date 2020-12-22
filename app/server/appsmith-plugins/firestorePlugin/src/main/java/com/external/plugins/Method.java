package com.external.plugins;

public enum Method {
    GET_DOCUMENT(true, false),
    GET_COLLECTION(false, false),
    SET_DOCUMENT(true, true),
    CREATE_DOCUMENT(true, true),
    ADD_TO_COLLECTION(false, true),
    UPDATE_DOCUMENT(true, true),
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
