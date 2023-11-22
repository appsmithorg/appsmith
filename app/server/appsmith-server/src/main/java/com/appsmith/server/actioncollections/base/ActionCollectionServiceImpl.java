package com.appsmith.server.actioncollections.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class ActionCollectionServiceImpl extends ActionCollectionServiceCEImpl implements ActionCollectionService {
    private final NewActionService newActionService;

    public ActionCollectionServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ActionCollectionRepository repository,
            AnalyticsService analyticsService,
            NewActionService newActionService,
            PolicyGenerator policyGenerator,
            ApplicationService applicationService,
            ResponseUtils responseUtils,
            ApplicationPermission applicationPermission,
            ActionPermission actionPermission) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                newActionService,
                policyGenerator,
                applicationService,
                responseUtils,
                applicationPermission,
                actionPermission);
        this.newActionService = newActionService;
    }

    @Override
    public Mono<List<ActionCollection>> archiveActionCollectionsByModuleId(String moduleId) {
        return repository
                .findAllByModuleIds(List.of(moduleId), null)
                .flatMap(actionCollection -> {
                    Set<String> actionIds = new HashSet<>();
                    actionIds.addAll(actionCollection
                            .getUnpublishedCollection()
                            .getDefaultToBranchedActionIdsMap()
                            .values());
                    return Flux.fromIterable(actionIds)
                            .flatMap(newActionService::archiveById)
                            .onErrorResume(throwable -> {
                                log.error(throwable.getMessage());
                                return Mono.empty();
                            })
                            .then(repository.archive(actionCollection));
                })
                .collectList();
    }

    @Override
    public Flux<ActionCollection> findAllUnpublishedComposedActionsByContextIdAndContextTypeAndModuleInstanceId(
            String contextId, CreatorContextType contextType, String moduleInstanceId, AclPermission permission) {
        return repository.findAllUnpublishedComposedCollectionsByContextIdAndContextTypeAndModuleInstanceId(
                contextId, contextType, moduleInstanceId, permission);
    }
}
