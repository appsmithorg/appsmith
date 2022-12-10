package com.appsmith.server.services;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.AnalyticEventDTO;
import com.appsmith.server.services.ce.NewActionServiceCE;
import reactor.core.publisher.Mono;

public interface NewActionService extends NewActionServiceCE {
    Mono<NewAction> sendNewActionAnalyticsEvent(AnalyticEventDTO analyticEventDTO, String origin);
}
