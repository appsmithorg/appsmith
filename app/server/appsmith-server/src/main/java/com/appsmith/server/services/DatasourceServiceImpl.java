package com.appsmith.server.services;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.ce.DatasourceServiceCEImpl;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Slf4j
@Service
public class DatasourceServiceImpl extends DatasourceServiceCEImpl implements DatasourceService {

    public DatasourceServiceImpl(Scheduler scheduler,
                                 Validator validator,
                                 MongoConverter mongoConverter,
                                 ReactiveMongoTemplate reactiveMongoTemplate,
                                 DatasourceRepository repository,
                                 WorkspaceService workspaceService,
                                 AnalyticsService analyticsService,
                                 SessionUserService sessionUserService,
                                 PluginService pluginService,
                                 PluginExecutorHelper pluginExecutorHelper,
                                 PolicyGenerator policyGenerator,
                                 SequenceService sequenceService,
                                 NewActionRepository newActionRepository,
                                 DatasourceContextService datasourceContextService,
                                 DatasourcePermission datasourcePermission,
                                 WorkspacePermission workspacePermission,
                                 DatasourceStorageService datasourceStorageService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, workspaceService,
                analyticsService, sessionUserService, pluginService, pluginExecutorHelper, policyGenerator,
                sequenceService, newActionRepository, datasourceContextService, datasourcePermission,
                workspacePermission, datasourceStorageService);

    }
}
