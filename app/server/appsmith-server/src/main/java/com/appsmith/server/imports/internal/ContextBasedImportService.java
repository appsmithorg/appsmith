package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;

public interface ContextBasedImportService<
                T extends ImportableContext, U extends ImportableContextDTO, V extends ImportableContextJson>
        extends ContextBasedImportServiceCE<T, U, V> {}
