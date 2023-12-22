package com.appsmith.server.imports.internal;

import com.appsmith.server.applications.imports.ApplicationImportService;
import com.appsmith.server.imports.importable.ImportService;
import org.springframework.stereotype.Component;

@Component
public class ImportServiceImpl extends ImportServiceCEImpl implements ImportService {

    public ImportServiceImpl(ApplicationImportService applicationImportService) {
        super(applicationImportService);
    }
}
