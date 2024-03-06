package com.appsmith.server.applications.base;

import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.ce_compatible.ApplicationServiceCECompatibleImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.WorkspacePermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ApplicationServiceImpl extends ApplicationServiceCECompatibleImpl implements ApplicationService {

    public ApplicationServiceImpl(
            Validator validator,
            ApplicationRepository repository,
            AnalyticsService analyticsService,
            PolicySolution policySolution,
            ConfigService configService,
            ResponseUtils responseUtils,
            PermissionGroupService permissionGroupService,
            NewActionRepository newActionRepository,
            AssetService assetService,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            SessionUserService sessionUserService,
            UserDataService userDataService,
            WorkspaceService workspaceService,
            WorkspacePermission workspacePermission) {

        super(
                validator,
                repository,
                analyticsService,
                policySolution,
                configService,
                responseUtils,
                permissionGroupService,
                newActionRepository,
                assetService,
                datasourcePermission,
                applicationPermission,
                sessionUserService,
                userDataService,
                workspaceService,
                workspacePermission);
    }
}
