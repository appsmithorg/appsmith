package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.dtos.ImportableContextJson;

public interface ContextBasedImportServiceCE<T extends ImportableContext> {

    ImportableContextJson extractImportableContextJson(String jsonString);
}
