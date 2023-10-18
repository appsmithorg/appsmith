package com.appsmith.server.newactions.base;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.AnalyticEventDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface NewActionService extends NewActionServiceCE {
    Mono<NewAction> sendNewActionAnalyticsEvent(AnalyticEventDTO analyticEventDTO, String origin);

    Mono<List<ActionDTO>> getAllUnpublishedModuleActions(String moduleId);
}
