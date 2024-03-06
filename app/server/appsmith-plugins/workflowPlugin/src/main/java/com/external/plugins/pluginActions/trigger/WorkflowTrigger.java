package com.external.plugins.pluginActions.trigger;

import com.appsmith.external.models.TriggerResultDTO;
import com.external.plugins.pluginActions.PluginActions;
import reactor.core.publisher.Mono;

public interface WorkflowTrigger extends PluginActions {
    Mono<TriggerResultDTO> getTriggerResult();
}
