package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.applications.base.ApplicationServiceCEImpl;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.NewActionRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.WorkspacePermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;

@Service
public class ApplicationServiceCECompatibleImpl extends ApplicationServiceCEImpl
        implements ApplicationServiceCECompatible {
    public ApplicationServiceCECompatibleImpl(
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
            PlatformTransactionManager transactionManager) {
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
                transactionManager);
    }
}
