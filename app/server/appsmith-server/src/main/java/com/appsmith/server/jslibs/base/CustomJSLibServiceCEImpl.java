package com.appsmith.server.jslibs.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.dtos.DBOpsType;
import com.appsmith.server.jslibs.context.ContextBasedJsLibService;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.dtos.CustomJSLibContextDTO.getDTOFromCustomJSLib;

@Slf4j
public class CustomJSLibServiceCEImpl extends BaseService<CustomJSLibRepository, CustomJSLib, String>
        implements CustomJSLibServiceCE {
    protected final ContextBasedJsLibService<Application> applicationContextBasedJsLibService;

    public CustomJSLibServiceCEImpl(
            Validator validator,
            CustomJSLibRepository repository,
            AnalyticsService analyticsService,
            ContextBasedJsLibService<Application> applicationContextBasedJsLibService) {
        super(validator, repository, analyticsService);
        this.applicationContextBasedJsLibService = applicationContextBasedJsLibService;
    }

    protected ContextBasedJsLibService<?> getContextBasedService(@NotNull CreatorContextType contextType) {
        return applicationContextBasedJsLibService;
    }

    @Override
    public Mono<Boolean> addJSLibsToContext(
            @NotNull String branchedContextId,
            CreatorContextType contextType,
            @NotNull Set<CustomJSLib> jsLibs,
            Boolean isForceInstall) {
        ContextBasedJsLibService<?> contextBasedService = getContextBasedService(contextType);

        Mono<Set<CustomJSLibContextDTO>> persistedJsLibsMono = Flux.fromIterable(jsLibs)
                .flatMap(jsLib -> persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(jsLib, isForceInstall))
                .collect(Collectors.toSet());
        return contextBasedService
                .getAllVisibleJSLibContextDTOFromContext(branchedContextId, false)
                .zipWith(persistedJsLibsMono)
                .map(tuple -> {
                    /*
                     TODO: try to convert it into a single update op where reading of list is not required
                     Tracked here: https://github.com/appsmithorg/appsmith/issues/18226
                    */
                    Set<CustomJSLibContextDTO> jsLibDTOsInContext = tuple.getT1();
                    Set<CustomJSLibContextDTO> currentJSLibDTOs = tuple.getT2();
                    jsLibDTOsInContext.addAll(currentJSLibDTOs);

                    return jsLibDTOsInContext;
                })
                .flatMap(updatedJSLibDTOSet ->
                        contextBasedService.updateJsLibsInContext(branchedContextId, updatedJSLibDTOSet))
                .map(count -> count > 0);
    }

    @Override
    public Mono<CustomJSLibContextDTO> persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(
            CustomJSLib jsLib, Boolean isForceInstall) {
        return persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(jsLib, isForceInstall, null, false);
    }

    @Override
    public Mono<CustomJSLibContextDTO> persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(
            CustomJSLib jsLib,
            Boolean isForceInstall,
            Map<DBOpsType, List<CustomJSLib>> customJSLibsDryOps,
            boolean isDryOps) {
        return repository
                .findUniqueCustomJsLib(jsLib)
                // Read more why Mono.defer is used here.
                // https://stackoverflow.com/questions/54373920/mono-switchifempty-is-always-called
                .switchIfEmpty(Mono.defer(() -> {
                    if (isDryOps) {
                        jsLib.updateForBulkWriteOperation();
                        addDryOpsForEntity(DBOpsType.SAVE, customJSLibsDryOps, jsLib);
                        return Mono.just(jsLib);
                    }
                    return repository.save(jsLib);
                }))
                .flatMap(foundJSLib -> {
                    /*
                       The first check is to make sure that we are able to detect any previously truncated data and overwrite it the next time we receive valid data.
                       The second check provides us with a backdoor to overwrite any faulty data that would have come in any time earlier.
                       Currently, once a custom JS lib data gets persisted there is no way to update it - the isForceInstall flag will allow a way to update this data.
                    */
                    if ((jsLib.getDefs().length() > foundJSLib.getDefs().length()) || isForceInstall) {
                        jsLib.setId(foundJSLib.getId());
                        if (isDryOps) {
                            addDryOpsForEntity(DBOpsType.SAVE, customJSLibsDryOps, jsLib);
                            return Mono.just(jsLib);
                        }
                        return repository.save(jsLib);
                    }

                    return Mono.just(foundJSLib);
                })
                .map(CustomJSLibContextDTO::getDTOFromCustomJSLib);
    }

    @Override
    public Mono<Boolean> removeJSLibFromContext(
            @NotNull String branchedContextId,
            CreatorContextType contextType,
            @NotNull CustomJSLib jsLib,
            Boolean isForceRemove) {
        ContextBasedJsLibService<?> contextBasedService = getContextBasedService(contextType);
        return contextBasedService
                .getAllVisibleJSLibContextDTOFromContext(branchedContextId, false)
                .map(jsLibDTOSet -> {
                    /*
                     TODO: try to convert it into a single update op where reading of list is not required
                     Tracked here: https://github.com/appsmithorg/appsmith/issues/18226
                    */
                    CustomJSLibContextDTO currentJSLibDTO = getDTOFromCustomJSLib(jsLib);
                    jsLibDTOSet.remove(currentJSLibDTO);

                    return jsLibDTOSet;
                })
                .flatMap(updatedJSLibDTOList ->
                        contextBasedService.updateJsLibsInContext(branchedContextId, updatedJSLibDTOList))
                .map(count -> count > 0);
    }

    @Override
    public Mono<List<CustomJSLib>> getAllJSLibsInContext(
            @NotNull String branchedContextId, CreatorContextType contextType, Boolean isViewMode) {
        ContextBasedJsLibService<?> contextBasedService = getContextBasedService(contextType);
        return contextBasedService
                .getAllVisibleJSLibContextDTOFromContext(branchedContextId, isViewMode)
                .flatMapMany(repository::findCustomJsLibsInContext)
                .collectList()
                .map(jsLibList -> {
                    jsLibList.sort(Comparator.comparing(CustomJSLib::getUidString));
                    return jsLibList;
                });
    }

    @Override
    public Flux<CustomJSLib> getAllVisibleJSLibsInContext(
            @NotNull String branchedContextId, CreatorContextType contextType, String branchName, Boolean isViewMode) {
        ContextBasedJsLibService<?> contextBasedService = getContextBasedService(contextType);
        return contextBasedService
                .getAllVisibleJSLibContextDTOFromContext(branchedContextId, isViewMode)
                .flatMapMany(repository::findCustomJsLibsInContext);
    }

    private void addDryOpsForEntity(
            DBOpsType queryType, Map<DBOpsType, List<CustomJSLib>> dryRunOpsMap, CustomJSLib createdCustomJsLib) {
        if (dryRunOpsMap.containsKey(queryType)) {
            dryRunOpsMap.get(queryType).add(createdCustomJsLib);
        } else {
            List<CustomJSLib> customJsLibList = new ArrayList<>();
            customJsLibList.add(createdCustomJsLib);
            dryRunOpsMap.put(queryType, customJsLibList);
        }
    }
}
