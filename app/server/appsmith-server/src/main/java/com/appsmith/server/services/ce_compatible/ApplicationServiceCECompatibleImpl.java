package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.applications.base.ApplicationServiceCEImpl;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PolicySolution;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
public class ApplicationServiceCECompatibleImpl extends ApplicationServiceCEImpl
        implements ApplicationServiceCECompatible {
    public ApplicationServiceCECompatibleImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
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
            UserDataService userDataService) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
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
                userDataService);
    }
}
