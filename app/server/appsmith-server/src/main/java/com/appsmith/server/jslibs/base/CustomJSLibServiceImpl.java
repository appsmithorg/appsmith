package com.appsmith.server.jslibs.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.jslibs.context.ContextBasedJsLibService;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.services.AnalyticsService;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CustomJSLibServiceImpl extends CustomJSLibServiceCEImpl implements CustomJSLibService {

    private final ContextBasedJsLibService<Package> packageContextBasedJsLibService;

    public CustomJSLibServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            CustomJSLibRepository repository,
            AnalyticsService analyticsService,
            ContextBasedJsLibService<Application> applicationContextBasedJsLibService,
            ContextBasedJsLibService<Package> packageContextBasedJsLibService) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                applicationContextBasedJsLibService);
        this.packageContextBasedJsLibService = packageContextBasedJsLibService;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    protected ContextBasedJsLibService<?> getContextBasedService(@NotNull CreatorContextType contextType) {
        return switch (contextType) {
            case APPLICATION -> applicationContextBasedJsLibService;
            case PACKAGE -> packageContextBasedJsLibService;
            default -> null;
        };
    }

    @Override
    public Mono<List<CustomJSLib>> getAllJSLibsInContext(
            String contextId, CreatorContextType contextType, String branchName, Boolean isViewMode) {
        Mono<List<CustomJSLib>> visibleLibsMono =
                super.getAllJSLibsInContext(contextId, contextType, branchName, isViewMode);

        ContextBasedJsLibService<?> contextBasedService = getContextBasedService(contextType);

        Mono<List<CustomJSLib>> hiddenLibsMono = contextBasedService
                .getAllHiddenJSLibContextDTOFromContext(contextId, branchName, isViewMode)
                .flatMapMany(repository::findCustomJsLibsInContext)
                .map(jsLib -> {
                    jsLib.setIsHidden(true);
                    return jsLib;
                })
                .collectList();

        return Mono.zip(visibleLibsMono, hiddenLibsMono)
                .map(tuple2 -> {
                    List<CustomJSLib> hiddenLibs = tuple2.getT2();
                    List<CustomJSLib> visibleLibs = tuple2.getT1();
                    hiddenLibs.removeIf(hiddenLib -> visibleLibs.stream()
                            .anyMatch(visibleLib -> visibleLib.getUidString().equals(hiddenLib.getUidString())));
                    hiddenLibs.addAll(visibleLibs);
                    return hiddenLibs;
                })
                .map(jsLibList -> {
                    jsLibList.sort(Comparator.comparing(CustomJSLib::getUidString));
                    return jsLibList;
                });
    }

    @Override
    public Mono<Boolean> addHiddenJSLibsToContext(
            @NotNull String contextId,
            CreatorContextType contextType,
            @NotNull Set<CustomJSLib> jsLibs,
            String branchName,
            Boolean isForceInstall) {
        ContextBasedJsLibService<?> contextBasedService = getContextBasedService(contextType);

        Mono<Set<CustomJSLibContextDTO>> toBeAddedJsLibsMono = Flux.fromIterable(jsLibs)
                .map(CustomJSLibContextDTO::getDTOFromCustomJSLib)
                .collect(Collectors.toSet());

        Mono<Set<CustomJSLibContextDTO>> hiddenLibsMono = contextBasedService
                .getAllHiddenJSLibContextDTOFromContext(contextId, branchName, false)
                .cache();

        Mono<Set<CustomJSLibContextDTO>> visibleLibsMono =
                contextBasedService.getAllVisibleJSLibContextDTOFromContext(contextId, branchName, false);

        Mono<Set<CustomJSLibContextDTO>> allExistingLibsMono = Mono.zip(hiddenLibsMono, visibleLibsMono)
                .map(tuple2 -> {
                    Set<CustomJSLibContextDTO> allExistingLibs = new HashSet<>();
                    allExistingLibs.addAll(tuple2.getT1());
                    allExistingLibs.addAll(tuple2.getT2());
                    return allExistingLibs;
                });
        return Mono.zip(allExistingLibsMono, hiddenLibsMono, toBeAddedJsLibsMono)
                .map(tuple -> {
                    /*
                     TODO: try to convert it into a single update op where reading of list is not required
                     Tracked here: https://github.com/appsmithorg/appsmith/issues/18226
                    */
                    Set<CustomJSLibContextDTO> jsLibDTOsInContext = tuple.getT1();
                    Set<CustomJSLibContextDTO> hiddenJsLibDTOsInContext = tuple.getT2();
                    Set<CustomJSLibContextDTO> currentJSLibDTOs = tuple.getT3();
                    currentJSLibDTOs.removeAll(jsLibDTOsInContext);

                    hiddenJsLibDTOsInContext.addAll(currentJSLibDTOs);

                    return hiddenJsLibDTOsInContext;
                })
                .flatMap(updatedHiddenJSLibDTOSet -> contextBasedService.updateHiddenJsLibsInContext(
                        contextId, branchName, updatedHiddenJSLibDTOSet))
                .map(updateResult -> updateResult.getModifiedCount() > 0);
    }
}
