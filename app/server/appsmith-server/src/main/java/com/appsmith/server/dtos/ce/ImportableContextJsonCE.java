package com.appsmith.server.dtos.ce;

import com.appsmith.server.constants.ImportableJsonType;

public abstract class ImportableContextJsonCE {

    /**
     * These are variables for demonstration only, it might change as we decide more on implementation
     */
    public int clientSchemaVersion;

    public int serverSchemaVersion;

    public abstract ImportableJsonType getImportableJsonType();
}
