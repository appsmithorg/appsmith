package com.appsmith.server.services.ce;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.repositories.ApiTemplateRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;


@Slf4j
public class ApiTemplateServiceCEImpl extends BaseService<ApiTemplateRepository, ApiTemplate, String> implements ApiTemplateServiceCE {

    public ApiTemplateServiceCEImpl(Scheduler scheduler,
                                    Validator validator,
                                    MongoConverter mongoConverter,
                                    ReactiveMongoTemplate reactiveMongoTemplate,
                                    ApiTemplateRepository repository,
                                    AnalyticsService analyticsService) {
        
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Flux<ApiTemplate> get(MultiValueMap<String, String> params) {
        ApiTemplate apiTemplateExample = new ApiTemplate();
        Sort sort = Sort.by(FieldName.NAME);

        if (params.getFirst(FieldName.ID) != null) {
            apiTemplateExample.setId(params.getFirst(FieldName.ID));
        }

        if (params.getFirst(FieldName.NAME) != null) {
            apiTemplateExample.setName(params.getFirst(FieldName.NAME));
        }

        if (params.getFirst("providerId") != null) {
            apiTemplateExample.setProviderId(params.getFirst("providerId"));
        }

        if (params.getFirst("versionId") != null) {
            apiTemplateExample.setVersionId(params.getFirst("versionId"));
        }

        return repository.findAll(Example.of(apiTemplateExample), sort);
    }
}
