package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibApplicationDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.FeatureFlagService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import javax.validation.constraints.NotNull;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.dtos.CustomJSLibApplicationDTO.getDTOFromCustomJSLib;

@Slf4j
public class CustomJSLibServiceCEImpl extends BaseService<CustomJSLibRepository, CustomJSLib, String> implements CustomJSLibServiceCE {
    ApplicationService applicationService;

    FeatureFlagService featureFlagService;
    public CustomJSLibServiceCEImpl(Scheduler scheduler,
                                    Validator validator,
                                    MongoConverter mongoConverter,
                                    ReactiveMongoTemplate reactiveMongoTemplate,
                                    CustomJSLibRepository repository,
                                    ApplicationService applicationService,
                                    AnalyticsService analyticsService,
                                    FeatureFlagService featureFlagService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);

        this.applicationService = applicationService;
        this.featureFlagService = featureFlagService;
    }

    @Override
    public Mono<Boolean> addJSLibToApplication(@NotNull String applicationId, @NotNull CustomJSLib jsLib,
                                               String branchName, Boolean isForceInstall) {
        return featureFlagService.check(FeatureFlagEnum.CUSTOM_JS_LIBRARY)
                .flatMap(truth -> {
                    if (!truth) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }
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
                            .flatMap(updatedJSLibDTOList -> {
                                Map<String, Object> fieldNameValueMap = Map.of(FieldName.UNPUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS, updatedJSLibDTOList);
                                return applicationService.update(applicationId, fieldNameValueMap, branchName);
                            })
                            .map(updateResult -> updateResult.getModifiedCount() > 0);
                });
    }

    @Override
    public Mono<CustomJSLibApplicationDTO> persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(CustomJSLib jsLib,
                                                                                             Boolean isForceInstall) {
        return repository.findByUidString(jsLib.getUidString())
                .flatMap(foundJSLib -> {
                    /*
                        The first check is to make sure that we are able to detect any previously truncated data and overwrite it the next time we receive valid data.
                        The second check provides us with a backdoor to overwrite any faulty data that would have come in any time earlier.
                        Currently, once a custom JS lib data gets persisted there is no way to update it - the isForceInstall flag will allow a way to update this data.
                     */
                    if ((jsLib.getDefs().length() > foundJSLib.getDefs().length()) || isForceInstall) {
                        jsLib.setId(foundJSLib.getId());
                        return repository.save(jsLib)
                                .then(Mono.just(getDTOFromCustomJSLib(jsLib)));
                    }

                    return Mono.just(getDTOFromCustomJSLib(foundJSLib));
                })
                //Read more why Mono.defer is used here. https://stackoverflow.com/questions/54373920/mono-switchifempty-is-always-called
                .switchIfEmpty( Mono.defer(() -> repository.save(jsLib).map(savedJsLib -> getDTOFromCustomJSLib(savedJsLib))));
    }

    @Override
    public Mono<Boolean> removeJSLibFromApplication(@NotNull String applicationId,
                                                    @NotNull CustomJSLib jsLib, String branchName,
                                                    Boolean isForceRemove) {

        return featureFlagService.check(FeatureFlagEnum.CUSTOM_JS_LIBRARY)
                .flatMap(truth -> {
                    if (!truth) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }
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
                            .flatMap(updatedJSLibDTOList -> {
                                Map<String, Object> fieldNameValueMap = Map.of(FieldName.UNPUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS, updatedJSLibDTOList);
                                return applicationService.update(applicationId, fieldNameValueMap, branchName);
                            })
                            .map(updateResult -> updateResult.getModifiedCount() > 0);
                });
    }

    @Override
    public Mono<List<CustomJSLib>> getAllJSLibsInApplication(@NotNull String applicationId, String branchName,
                                                             Boolean isViewMode) {
        return featureFlagService.check(FeatureFlagEnum.CUSTOM_JS_LIBRARY)
                .flatMap(truth -> {
                    if (!truth) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }
                    return getAllCustomJSLibsFromApplication(applicationId, branchName, isViewMode);
                });
    }

    @Override
    public Mono<List<CustomJSLib>> getAllJSLibsInApplicationForExport(String applicationId, String branchName, Boolean isViewMode) {
        return getAllCustomJSLibsFromApplication(applicationId, branchName, isViewMode);
    }

    private Mono<List<CustomJSLib>> getAllCustomJSLibsFromApplication(String applicationId, String branchName, boolean isViewMode) {
        return getAllJSLibApplicationDTOFromApplication(applicationId, branchName, isViewMode)
                .map(jsLibDTOSet -> jsLibDTOSet.stream()
                        .map(dto -> dto.getUidString())
                        .collect(Collectors.toList())
                )
                .flatMapMany(Flux::fromIterable)
                .flatMap(uidString -> repository.findByUidString(uidString))
                .collectList()
                .map(jsLibList -> {
                    Collections.sort(jsLibList, Comparator.comparing(CustomJSLib::getUidString));
                    return jsLibList;
                });
    }

    @Override
    public Mono<Set<CustomJSLibApplicationDTO>> getAllJSLibApplicationDTOFromApplication(@NotNull String applicationId,
                                                                                         String branchName,
                                                                                         Boolean isViewMode) {
        return applicationService.findByIdAndBranchName(applicationId,
                        List.of(isViewMode ? FieldName.PUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS :
                                FieldName.UNPUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS), branchName)
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