package com.appsmith.server.services;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.ce.DatasourceServiceCEImpl;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import jakarta.validation.Validator;

@Slf4j
@Service
public class DatasourceServiceImpl extends DatasourceServiceCEImpl implements DatasourceService {

    private final VariableReplacementService variableReplacementService;

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
                                 VariableReplacementService variableReplacementService,
                                 DatasourcePermission datasourcePermission,
                                 WorkspacePermission workspacePermission) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, workspaceService,
                analyticsService, sessionUserService, pluginService, pluginExecutorHelper, policyGenerator,
                sequenceService, newActionRepository, datasourceContextService, datasourcePermission,
                workspacePermission);

        this.variableReplacementService = variableReplacementService;
    }

    @Override
    public Mono<Datasource> getValidDatasourceFromActionMono(ActionDTO actionDTO, AclPermission aclPermission) {
        return super.getValidDatasourceFromActionMono(actionDTO, aclPermission)
                .flatMap(datasource1 -> {
                    Mono<AppsmithDomain> datasourceConfigurationMono = this.variableReplacementService
                            .replaceAll(datasource1.getDatasourceConfiguration());
                    return datasourceConfigurationMono.flatMap(
                            configuration -> {
                                datasource1.setDatasourceConfiguration((DatasourceConfiguration) configuration);
                                return Mono.just(datasource1);
                            });
                });
    }
}
