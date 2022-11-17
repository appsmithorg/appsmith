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
                    // TODO: try to convert it into a single update op where reading of list is not required
                    // Tracked here: https://github.com/appsmithorg/appsmith/issues/18226
                    if (!jsLibs.contains(jsLib)) {
                        jsLibs.add(jsLib);
                    }
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
                    // TODO: try to convert it into a single update op where reading of list is not required
                    // Tracked here: https://github.com/appsmithorg/appsmith/issues/18226
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
