package com.appsmith.server.newactions.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.AnalyticEventDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface NewActionService extends NewActionServiceCE {
    Mono<NewAction> sendNewActionAnalyticsEvent(AnalyticEventDTO analyticEventDTO, String origin);

    Mono<List<NewAction>> archiveActionsByModuleId(String moduleId);

    Mono<NewAction> findPublicActionByModuleId(String moduleId);

    Flux<NewAction> findUnpublishedOnLoadActionsExplicitSetByUserInModule(String moduleId);

    Flux<NewAction> findAllUnpublishedComposedActionsByContextIdAndContextTypeAndModuleInstanceId(
            String contextId,
            CreatorContextType contextType,
            String moduleInstanceId,
            AclPermission permission,
            boolean includeJs);
}
