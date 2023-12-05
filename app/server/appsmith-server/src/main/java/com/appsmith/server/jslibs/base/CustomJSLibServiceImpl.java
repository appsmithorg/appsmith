package com.appsmith.server.jslibs.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.Application;
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
import reactor.core.scheduler.Scheduler;

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
    protected Set<String> filterAndMapGlobalUidStrings(Set<CustomJSLibContextDTO> customJSLibContextDTOS) {
        return customJSLibContextDTOS.stream()
                // Only get the global library uidStrings, others will get covered in the local libs criteria
                .filter(customJSLibApplicationDTO -> customJSLibApplicationDTO.getContextId() == null)
                .map(CustomJSLibContextDTO::getUidString)
                .collect(Collectors.toSet());
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
}
