package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibApplicationDTO;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.BaseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.dtos.CustomJSLibApplicationDTO.getDTOFromCustomJSLib;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static reactor.core.publisher.Mono.zip;

@Slf4j
public class CustomJSLibServiceCEImpl extends BaseService<CustomJSLibRepository, CustomJSLib, String> implements CustomJSLibServiceCE {
    private static final String INSTALLED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS = "installedCustomJSLibs";

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
                                               String branchName) {
        return zip(getAllJSLibApplicationDTOFromApplication(applicationId, branchName),
                createDTOFromCustomJSLibIfDoesNotExist(jsLib))
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
                        INSTALLED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS, updatedJSLibDTOList, branchName))
                .map(updateResult -> updateResult.getModifiedCount() > 0);
    }

    private Mono<CustomJSLibApplicationDTO> createDTOFromCustomJSLibIfDoesNotExist(CustomJSLib jsLib) {
        return repository.findByAccessorString(jsLib.getAccessorString())
                .map(foundJSLib -> getDTOFromCustomJSLib(foundJSLib))
                .switchIfEmpty(
                        repository.save(jsLib)
                                .map(savedJSLib -> getDTOFromCustomJSLib(savedJSLib))
                );
    }

    @Override
    public Mono<Boolean> removeJSLibFromApplication(@NotNull String applicationId,
                                                    @NotNull CustomJSLib jsLib, String branchName) {
        return zip(getAllJSLibApplicationDTOFromApplication(applicationId, branchName),
                createDTOFromCustomJSLibIfDoesNotExist(jsLib))
                .map(tuple -> {
                    /**
                     * TODO: try to convert it into a single update op where reading of list is not required
                     * Tracked here: https://github.com/appsmithorg/appsmith/issues/18226
                     */
                    Set<CustomJSLibApplicationDTO> jsLibDTOsInApplication = tuple.getT1();
                    CustomJSLibApplicationDTO currentJSLibDTO = tuple.getT2();
                    jsLibDTOsInApplication.remove(currentJSLibDTO);

                    return jsLibDTOsInApplication;
                })
                .flatMap(updatedJSLibDTOList -> applicationService.update(applicationId,
                        INSTALLED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS, updatedJSLibDTOList, branchName))
                .map(updateResult -> updateResult.getModifiedCount() > 0);
    }

    @Override
    public Mono<List<CustomJSLib>> getAllJSLibsInApplication(@NotNull String applicationId, String branchName) {
        return getAllJSLibApplicationDTOFromApplication(applicationId, branchName)
                .map(jsLibDTOSet -> jsLibDTOSet.stream()
                        .map(dto -> dto.getId())
                        .collect(Collectors.toList())
                )
                .flatMapMany(jsLibIdList -> repository.findAllById(jsLibIdList))
                .collectList();
    }

    @Override
    public Mono<Set<CustomJSLibApplicationDTO>> getAllJSLibApplicationDTOFromApplication(@NotNull String applicationId, String branchName) {
        return applicationService.findByIdAndBranchName(applicationId,
                List.of(INSTALLED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS), branchName)
                .map(Application::getInstalledCustomJSLibs);
    }
}
