package com.appsmith.server.services;

import com.appsmith.server.domains.PropertyPane;
import com.appsmith.server.domains.WidgetChildProperty;
import com.appsmith.server.domains.WidgetSectionProperty;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PropertyPaneRepository;
import com.segment.analytics.Analytics;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class PropertyPaneServiceImpl extends BaseService<PropertyPaneRepository, PropertyPane, String> implements PropertyPaneService {
    public PropertyPaneServiceImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, PropertyPaneRepository repository, Analytics analytics, SessionUserService sessionUserService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analytics, sessionUserService);
    }

    @Override
    public Mono<PropertyPane> create(PropertyPane propertyPane) {
        if (propertyPane.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        }
        if (propertyPane.getConfig() != null) {
            Map<String, List<WidgetSectionProperty>> configMap = propertyPane.getConfig();
            configMap.forEach((key, sectionProperty) -> {
                List<WidgetSectionProperty> widgetSectionProperties = sectionProperty;
                for (WidgetSectionProperty widgetSectionProperty : widgetSectionProperties) {
                    widgetSectionProperty.setId(new ObjectId().toString());
                    List<WidgetChildProperty> widgetChildProperties = widgetSectionProperty.getChildren();
                    for (WidgetChildProperty widgetChildProperty : widgetChildProperties) {
                        widgetChildProperty.setId(new ObjectId().toString());
                    }
                    widgetSectionProperty.setChildren(widgetChildProperties);
                }
                configMap.put(key, widgetSectionProperties);
            });
            propertyPane.setConfig(configMap);
        }
        return repository
                .save(propertyPane)
                .flatMap(this::segmentTrackCreate);
    }
}
