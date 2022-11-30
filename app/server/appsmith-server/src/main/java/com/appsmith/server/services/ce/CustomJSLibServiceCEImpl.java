package com.appsmith.server.services.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibApplicationDTO;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.BaseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import javax.validation.constraints.NotNull;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.dtos.CustomJSLibApplicationDTO.getDTOFromCustomJSLib;
import static reactor.core.publisher.Mono.zip;

@Slf4j
public class CustomJSLibServiceCEImpl extends BaseService<CustomJSLibRepository, CustomJSLib, String> implements CustomJSLibServiceCE {
    public static final String UNPUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS = "unpublishedCustomJSLibs";
    public static final String PUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS = "publishedCustomJSLibs";

    ApplicationService applicationService;

    public CustomJSLibServiceCEImpl(Scheduler scheduler,
                                    Validator validator,
                                    MongoConverter mongoConverter,
                                    ReactiveMongoTemplate reactiveMongoTemplate,
                                    CustomJSLibRepository repository,
                                    ApplicationService applicationService,
                                    AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);

        this.applicationService = applicationService;
    }

    @Override
    public Mono<Boolean> addJSLibToApplication(@NotNull String applicationId, @NotNull CustomJSLib jsLib,
                                               String branchName, Boolean isForceInstall) {
        return getAllJSLibApplicationDTOFromApplication(applicationId, branchName, false)
                .zipWith(persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(jsLib, isForceInstall))
                .map(tuple -> {
                    /**
                     * TODO: try to convert it into a single update op where reading of list is not required
                     * Tracked here: https://github.com/appsmithorg/appsmith/issues/18226
                     */
                    Set<CustomJSLibApplicationDTO> jsLibDTOsInApplication = tuple.getT1();
                    CustomJSLibApplicationDTO currentJSLibDTO = tuple.getT2();
                    if (!jsLibDTOsInApplication.contains(currentJSLibDTO)) {
                        jsLibDTOsInApplication.add(currentJSLibDTO);
                    }

                    return jsLibDTOsInApplication;
                })
                .flatMap(updatedJSLibDTOList -> applicationService.update(applicationId,
                        UNPUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS, updatedJSLibDTOList, branchName))
                .map(updateResult -> updateResult.getModifiedCount() > 0);
    }

    private Mono<CustomJSLibApplicationDTO> persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(CustomJSLib jsLib,
                                                                                              Boolean isForceInstall) {
        return repository.findByUidString(jsLib.getUidString())
                .flatMap(foundJSLib -> {
                    // TODO: add comment
                    if ((jsLib.getDefs().length() > foundJSLib.getDefs().length()) || isForceInstall) {
                        jsLib.setId(foundJSLib.getId());
                        return repository.save(jsLib)
                                        .then(Mono.just(getDTOFromCustomJSLib(jsLib)));
                    }

                    return Mono.just(getDTOFromCustomJSLib(foundJSLib));
                })
                .switchIfEmpty(
                        repository.save(jsLib)
                                .map(savedJSLib -> getDTOFromCustomJSLib(savedJSLib))
                );
    }

    @Override
    public Mono<Boolean> removeJSLibFromApplication(@NotNull String applicationId,
                                                    @NotNull CustomJSLib jsLib, String branchName,
                                                    Boolean isForceRemove) {
        return getAllJSLibApplicationDTOFromApplication(applicationId, branchName, false)
                .map(jsLibDTOSet -> {
                    /**
                     * TODO: try to convert it into a single update op where reading of list is not required
                     * Tracked here: https://github.com/appsmithorg/appsmith/issues/18226
                     */
                    CustomJSLibApplicationDTO currentJSLibDTO = getDTOFromCustomJSLib(jsLib);
                    jsLibDTOSet.remove(currentJSLibDTO);

                    return jsLibDTOSet;
                })
                .flatMap(updatedJSLibDTOList -> applicationService.update(applicationId,
                        UNPUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS, updatedJSLibDTOList, branchName))
                .map(updateResult -> updateResult.getModifiedCount() > 0);
    }

    @Override
    public Mono<List<CustomJSLib>> getAllJSLibsInApplication(@NotNull String applicationId, String branchName,
                                                             Boolean isViewMode) {
        return getAllJSLibApplicationDTOFromApplication(applicationId, branchName, isViewMode)
                .map(jsLibDTOSet -> jsLibDTOSet.stream()
                        .map(dto -> dto.getId())
                        .collect(Collectors.toList())
                )
                .flatMapMany(jsLibIdList -> repository.findAllById(jsLibIdList))
                .collectList()
                .map(jsLibList -> {
                    Collections.sort(jsLibList, Comparator.comparing(CustomJSLib::getName));
                    return jsLibList;
                });
    }

    @Override
    public Mono<Set<CustomJSLibApplicationDTO>> getAllJSLibApplicationDTOFromApplication(@NotNull String applicationId,
                                                                                         String branchName,
                                                                                         Boolean isViewMode) {
        return applicationService.findByIdAndBranchName(applicationId,
                List.of(isViewMode ? PUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS :
                        UNPUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS), branchName)
                .map(application -> {
                    if (isViewMode) {
                        return application.getPublishedCustomJSLibs() == null ? new HashSet<>() :
                                application.getPublishedCustomJSLibs();
                    }

                    return application.getUnpublishedCustomJSLibs() == null ? new HashSet<>() :
                            application.getUnpublishedCustomJSLibs();
                });
    }
}
