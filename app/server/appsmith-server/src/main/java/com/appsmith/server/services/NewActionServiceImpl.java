package com.appsmith.server.services;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.helpers.AngularHelper;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.ce.NewActionServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
@Slf4j
public class NewActionServiceImpl extends NewActionServiceCEImpl implements NewActionService {

    private final VariableReplacementService variableReplacementService;

    public NewActionServiceImpl(Scheduler scheduler,
                                Validator validator,
                                MongoConverter mongoConverter,
                                ReactiveMongoTemplate reactiveMongoTemplate,
                                NewActionRepository repository,
                                AnalyticsService analyticsService,
                                DatasourceService datasourceService,
                                PluginService pluginService,
                                DatasourceContextService datasourceContextService,
                                PluginExecutorHelper pluginExecutorHelper,
                                MarketplaceService marketplaceService,
                                PolicyGenerator policyGenerator,
                                NewPageService newPageService,
                                ApplicationService applicationService,
                                SessionUserService sessionUserService,
                                PolicyUtils policyUtils,
                                AuthenticationValidator authenticationValidator,
                                ConfigService configService,
                                ResponseUtils responseUtils,
                                VariableReplacementService variableReplacementService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                datasourceService, pluginService, datasourceContextService, pluginExecutorHelper, marketplaceService,
                policyGenerator, newPageService, applicationService, sessionUserService, policyUtils,
                authenticationValidator, configService, responseUtils);

        this.variableReplacementService = variableReplacementService;
    }

    @Override
    public Mono<ActionDTO> getValidActionForExecution(ExecuteActionDTO executeActionDTO, String actionId, NewAction newAction) {
        return super.getValidActionForExecution(executeActionDTO, actionId, newAction)
                .flatMap(validAction -> {

                    // Find all the variables which must be substituted before
                    Set<String> variables = AngularHelper.extractAngularKeysFromFields(validAction.getActionConfiguration());

                    if (variables.isEmpty()) {
                        // Nothing to do here.
                        return Mono.just(validAction);
                    }

                    Map<String, String> replacementMap = new HashMap<>();

                    return Flux.fromIterable(variables)
                            .flatMap(variable -> {
                                Mono<String> replacedValueMono = variableReplacementService.replaceValue(variable).cache();

                                return replacedValueMono
                                        .map(value -> Boolean.TRUE)
                                        .switchIfEmpty(Mono.just(Boolean.FALSE))
                                        .flatMap(bool -> {
                                            // We have successfully managed to find a replacement for the variable
                                            if (bool.equals(Boolean.TRUE)) {
                                                return replacedValueMono
                                                        .map(value -> {
                                                            replacementMap.put(variable, value);
                                                            return Boolean.TRUE;
                                                        });
                                            }

                                            return Mono.just(Boolean.FALSE);
                                        });
                            })
                            .then(Mono.just(replacementMap))
                            .map(finalMap -> AngularHelper.renderFieldValues(validAction, finalMap));

                });
    }
}
