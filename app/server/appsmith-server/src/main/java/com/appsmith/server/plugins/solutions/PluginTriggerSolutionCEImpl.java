package com.appsmith.server.plugins.solutions;

import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginServiceImpl;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourceTriggerSolution;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import org.apache.commons.lang3.StringUtils;
import org.pf4j.PluginManager;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.DATASOURCE_ID;

@Component
public class PluginTriggerSolutionCEImpl extends PluginServiceImpl implements PluginTriggerSolutionCE {
    private final DatasourceTriggerSolution datasourceTriggerSolution;
    private final PluginExecutorHelper pluginExecutorHelper;

    public PluginTriggerSolutionCEImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            PluginRepository repository,
            AnalyticsService analyticsService,
            WorkspaceService workspaceService,
            PluginManager pluginManager,
            ReactiveRedisTemplate<String, String> reactiveTemplate,
            ChannelTopic topic,
            ObjectMapper objectMapper,
            DatasourceTriggerSolution datasourceTriggerSolution,
            PluginExecutorHelper pluginExecutorHelper) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                workspaceService,
                pluginManager,
                reactiveTemplate,
                topic,
                objectMapper);
        this.datasourceTriggerSolution = datasourceTriggerSolution;
        this.pluginExecutorHelper = pluginExecutorHelper;
    }

    @Override
    public Mono<TriggerResultDTO> trigger(String pluginId, String environmentId, TriggerRequestDTO triggerRequestDTO) {
        Map<String, Object> triggerParameters = triggerRequestDTO.getParameters();
        if (CollectionUtils.isEmpty(triggerParameters)) {
            return Mono.error(new AppsmithException(AppsmithError.TRIGGER_PARAMETERS_EMPTY));
        }

        if (checkIfDatasourceIdExists(triggerRequestDTO)) {
            String datasourceId = (String) triggerRequestDTO.getParameters().get(DATASOURCE_ID);
            return datasourceTriggerSolution.trigger(datasourceId, environmentId, triggerRequestDTO);
        }

        Mono<PluginExecutor> pluginExecutorMono =
                this.findById(pluginId).flatMap(plugin -> pluginExecutorHelper.getPluginExecutor(Mono.just(plugin)));

        /*
         * Since there is no datasource provided, we are passing the Datasource Context connection and datasourceConfiguration as null.
         * We will leave the execution to respective plugin executor.
         */
        return pluginExecutorMono.flatMap(
                pluginExecutor -> ((PluginExecutor<Object>) pluginExecutor).trigger(null, null, triggerRequestDTO));
    }

    private Boolean checkIfDatasourceIdExists(TriggerRequestDTO triggerRequestDTO) {
        Map<String, Object> triggerParameters = triggerRequestDTO.getParameters();
        return !triggerParameters.containsKey(DATASOURCE_ID)
                && StringUtils.isEmpty((String) triggerParameters.get(DATASOURCE_ID));
    }
}
