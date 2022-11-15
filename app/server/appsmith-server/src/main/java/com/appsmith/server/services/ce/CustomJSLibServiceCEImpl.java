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
    public Mono<List<CustomJSLib>> addJSLibToApplication(String applicationId, CustomJSLib jsLib) {

    }

    @Override
    public Mono<List<CustomJSLib>> deleteJSLibFromApplication(String applicationId, CustomJSLib jsLib) {
        return null;
    }

    @Override
    public Mono<List<CustomJSLib>> getAllJSLibInApplication(String applicationId) {
        return null;
    }
}
