package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import org.springframework.stereotype.Component;

@Component
public class ApplicationsDiagnosticsCollector extends ApplicationsDiagnosticsCollectorCE {

    public ApplicationsDiagnosticsCollector(
            WorkspaceRepository workspaceRepository,
            ApplicationRepository applicationRepository,
            NewPageRepository newPageRepository,
            NewActionRepository newActionRepository,
            ActionCollectionRepository actionCollectionRepository) {
        super(
                workspaceRepository,
                applicationRepository,
                newPageRepository,
                newActionRepository,
                actionCollectionRepository);
    }
}
