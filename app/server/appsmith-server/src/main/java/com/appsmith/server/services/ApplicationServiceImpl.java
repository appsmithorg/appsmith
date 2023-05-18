package com.appsmith.server.services;

import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.ApplicationServiceCEImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import jakarta.validation.Validator;


@Slf4j
@Service
public class ApplicationServiceImpl extends ApplicationServiceCEImpl implements ApplicationService {

    public ApplicationServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  ApplicationRepository repository,
                                  AnalyticsService analyticsService,
                                  PolicyUtils policyUtils,
                                  ConfigService configService,
                                  SessionUserService sessionUserService,
                                  ResponseUtils responseUtils,
                                  PermissionGroupService permissionGroupService,
                                  TenantService tenantService,
                                  AssetService assetService,
                                  UserRepository userRepository,
                                  DatasourcePermission datasourcePermission,
                                  ApplicationPermission applicationPermission) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService, policyUtils,
                configService, sessionUserService, responseUtils, permissionGroupService, tenantService, assetService,
                userRepository, datasourcePermission, applicationPermission);

    }
}
