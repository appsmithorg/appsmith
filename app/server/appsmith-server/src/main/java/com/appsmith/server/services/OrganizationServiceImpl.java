package com.appsmith.server.services;

import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.OrganizationServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
public class OrganizationServiceImpl extends OrganizationServiceCEImpl implements OrganizationService {

    public OrganizationServiceImpl(Scheduler scheduler,
                                   Validator validator,
                                   MongoConverter mongoConverter,
                                   ReactiveMongoTemplate reactiveMongoTemplate,
                                   OrganizationRepository repository,
                                   AnalyticsService analyticsService,
                                   PluginRepository pluginRepository,
                                   SessionUserService sessionUserService,
                                   UserOrganizationService userOrganizationService,
                                   UserRepository userRepository,
                                   RoleGraph roleGraph,
                                   AssetRepository assetRepository,
                                   AssetService assetService,
                                   ApplicationRepository applicationRepository) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                pluginRepository, sessionUserService, userOrganizationService, userRepository, roleGraph,
                assetRepository, assetService, applicationRepository);
    }
}
