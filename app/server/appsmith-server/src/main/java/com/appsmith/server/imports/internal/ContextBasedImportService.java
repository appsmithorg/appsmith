package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.dtos.ImportableContextDTO;

public interface ContextBasedImportService<T extends ImportableContext, U extends ImportableContextDTO>
        extends ContextBasedImportServiceCE<T, U> {}
