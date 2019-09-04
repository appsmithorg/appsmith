package com.appsmith.server.services;

import com.appsmith.server.domains.Widget;
import com.appsmith.server.repositories.WidgetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
@Slf4j
public class WidgetServiceImpl extends BaseService<WidgetRepository, Widget, String> implements WidgetService {

    private WidgetRepository widgetRepository;

    @Autowired
    public WidgetServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate mongoTemplate,
                             WidgetRepository widgetRepository) {
        super(scheduler, validator, mongoConverter, mongoTemplate, widgetRepository);
        this.widgetRepository = widgetRepository;
    }

    @Override
    public Mono<Widget> getByName(String name) {
        return widgetRepository.findByName(name);
    }

}
