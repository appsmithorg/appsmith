package com.appsmith.server.imports.internal;

import com.appsmith.server.applications.imports.ApplicationImportService;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.imports.importable.ImportService;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.reactive.TransactionalOperator;

@Component
public class ImportServiceImpl extends ImportServiceCEImpl implements ImportService {

    public ImportServiceImpl(
            ApplicationImportService applicationImportService,
            WorkspaceService workspaceService,
            SessionUserService sessionUserService,
            ImportableService<CustomJSLib> customJSLibImportableService,
            TransactionalOperator transactionalOperator,
            AnalyticsService analyticsService) {
        super(
                applicationImportService,
                workspaceService,
                sessionUserService,
                customJSLibImportableService,
                transactionalOperator,
                analyticsService);
    }
}
