package com.appsmith.server.applications.imports;

import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.imports.internal.ContextBasedImportService;

public interface ApplicationImportServiceCE
        extends ContextBasedImportService<Application, ApplicationImportDTO, ApplicationJson> {}
