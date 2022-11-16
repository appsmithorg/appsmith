package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import javax.validation.constraints.NotNull;
import java.util.List;

public class CustomJSLibServiceCEImpl extends BaseService<ApplicationRepository, Application, String> implements CustomJSLibServiceCE {
    public CustomJSLibServiceCEImpl(Scheduler scheduler,
                                    Validator validator,
                                    MongoConverter mongoConverter,
                                    ReactiveMongoTemplate reactiveMongoTemplate,
                                    ApplicationRepository repository,
                                    AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Mono<Boolean> addJSLibToApplication(@NotNull String applicationId, @NotNull CustomJSLib jsLib) {
        return getAllJSLibsInApplication(applicationId)
                .map(jsLibs -> {
                    // TODO: check if it already exits
                    // TODO: add thread lock or use a diff DS like concurrentMap
                    jsLibs.add(jsLib);
                    return jsLibs;
                })
                .flatMap(updatedJSLibs -> repository.updateByIdAndFieldName(applicationId, "installedCustomJSLibs",
                        updatedJSLibs))
                .map(updateResult -> updateResult.getModifiedCount() > 0);
    }

    @Override
    public Mono<Boolean> removeJSLibFromApplication(@NotNull String applicationId,
                                                    @NotNull CustomJSLib jsLib) {
        return getAllJSLibsInApplication(applicationId)
                .map(jsLibs -> {
                    jsLibs.remove(jsLib);
                    return jsLibs;
                })
                .flatMap(updatedJSLibs -> repository.updateByIdAndFieldName(applicationId, "installedCustomJSLibs",
                        updatedJSLibs))
                .map(updateResult -> updateResult.getModifiedCount() > 0);
    }

    @Override
    public Mono<List<CustomJSLib>> getAllJSLibsInApplication(@NotNull String applicationId) {
        return repository.findByIdAndFieldName(applicationId, "installedCustomJSLibs")
                .map(Application::getInstalledCustomJSLibs);
    }
}
