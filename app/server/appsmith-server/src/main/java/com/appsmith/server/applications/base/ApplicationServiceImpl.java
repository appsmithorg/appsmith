package com.appsmith.server.applications.base;

import com.appsmith.server.artifacts.base.artifactbased.ArtifactBasedService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.NewActionRepositoryCake;
import com.appsmith.server.repositories.cakes.WorkspaceRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.ce_compatible.ApplicationServiceCECompatibleImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.transaction.CustomTransactionalOperator;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ApplicationServiceImpl extends ApplicationServiceCECompatibleImpl
        implements ApplicationService, ArtifactBasedService<Application> {

    public ApplicationServiceImpl(
            Validator validator,
            ApplicationRepository repositoryDirect,
            ApplicationRepositoryCake repository,
            AnalyticsService analyticsService,
            PolicySolution policySolution,
            PermissionGroupService permissionGroupService,
            NewActionRepositoryCake newActionRepository,
            AssetService assetService,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            SessionUserService sessionUserService,
            UserDataService userDataService,
            WorkspaceService workspaceService,
            WorkspacePermission workspacePermission,
            ObservationRegistry observationRegistry,
            WorkspaceRepositoryCake workspaceRepositoryCake,
            CustomTransactionalOperator transactionManager) {
        super(
                validator,
                repositoryDirect,
                repository,
                analyticsService,
                policySolution,
                permissionGroupService,
                newActionRepository,
                assetService,
                datasourcePermission,
                applicationPermission,
                sessionUserService,
                userDataService,
                workspaceService,
                workspacePermission,
                observationRegistry,
                workspaceRepositoryCake,
                transactionManager);
    }
}
