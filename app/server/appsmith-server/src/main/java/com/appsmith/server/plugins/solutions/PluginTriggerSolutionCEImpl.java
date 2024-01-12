package com.appsmith.server.plugins.solutions;

import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.solutions.DatasourceTriggerSolution;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class PluginTriggerSolutionCEImpl implements PluginTriggerSolutionCE {
    private final DatasourceTriggerSolution datasourceTriggerSolution;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PluginRepository pluginRepository;

    public PluginTriggerSolutionCEImpl(
            DatasourceTriggerSolution datasourceTriggerSolution,
            PluginExecutorHelper pluginExecutorHelper,
            PluginRepository pluginRepository) {

        this.datasourceTriggerSolution = datasourceTriggerSolution;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.pluginRepository = pluginRepository;
    }

    /**
     * The trigger method is used to fetch the Dynamic data required by the UQI rendered query forms.
     * This method can take 2 different routes, based on whether the {@code }datasourceId} is present or not.
     * <p>
     * If the {@code datasourceId} is present, then we use the {@code trigger()} method from {@link DatasourceTriggerSolution},
     * else we directly use the {@code trigger} method from {@link  PluginExecutor}.
     *
     * @param pluginId Plugin ID associated to Query
     * @param environmentId Environment ID associated to Query
     * @param triggerRequestDTO Payload which will be interpreted by Plugin to request dynamic data.
     * @param httpHeaders Appsmith headers
     * @return Dynamic data packaged inside {@link TriggerRequestDTO}
     *
     */
    @Override
    public Mono<TriggerResultDTO> trigger(
            String pluginId, String environmentId, TriggerRequestDTO triggerRequestDTO, HttpHeaders httpHeaders) {
        Map<String, Object> triggerParameters = triggerRequestDTO.getParameters();
        if (CollectionUtils.isEmpty(triggerParameters)) {
            return Mono.error(new AppsmithException(AppsmithError.TRIGGER_PARAMETERS_EMPTY));
        }

        if (StringUtils.isNotEmpty(triggerRequestDTO.getDatasourceId())) {
            return datasourceTriggerSolution.trigger(
                    triggerRequestDTO.getDatasourceId(), environmentId, triggerRequestDTO);
        }

        Mono<Plugin> pluginMono = pluginRepository.findById(pluginId).cache();

        Mono<PluginExecutor> pluginExecutorMono =
                pluginMono.flatMap(plugin -> pluginExecutorHelper.getPluginExecutor(Mono.just(plugin)));

        /*
         * Since there is no datasource provided, we are passing the Datasource Context connection and datasourceConfiguration as null.
         * We will leave the execution to respective plugin executor.
         */
        return Mono.zip(pluginMono, pluginExecutorMono).flatMap(pair -> {
            Plugin plugin = pair.getT1();
            PluginExecutor pluginExecutor = pair.getT2();
            setHeadersToTriggerRequest(plugin, httpHeaders, triggerRequestDTO);
            return ((PluginExecutor<Object>) pluginExecutor).trigger(null, null, triggerRequestDTO);
        });
    }

    protected void setHeadersToTriggerRequest(
            Plugin plugin, HttpHeaders httpHeaders, TriggerRequestDTO triggerRequestDTO) {}
}
