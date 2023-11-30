package com.appsmith.server.jslibs.base;

import com.appsmith.server.dtos.CustomJSLibApplicationDTO;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CustomJSLibServiceImpl extends CustomJSLibServiceCEImpl implements CustomJSLibService {

    public CustomJSLibServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            CustomJSLibRepository repository,
            ApplicationService applicationService,
            AnalyticsService analyticsService) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                applicationService,
                analyticsService);
    }

    @Override
    protected Set<String> filterAndMapGlobalUidStrings(Set<CustomJSLibApplicationDTO> customJSLibApplicationDTOS) {
        return customJSLibApplicationDTOS.stream()
                // Only get the global library uidStrings, others will get covered in the local libs criteria
                .filter(customJSLibApplicationDTO -> customJSLibApplicationDTO.getContextId() == null)
                .map(CustomJSLibApplicationDTO::getUidString)
                .collect(Collectors.toSet());
    }
}
