package com.mobtools.server.services;

import com.mobtools.server.domains.Widget;
import com.mobtools.server.repositories.WidgetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
@Slf4j
public class WidgetServiceImpl extends BaseService<WidgetRepository, Widget, String> implements WidgetService {

    private WidgetRepository widgetRepository;

    @Autowired
    public WidgetServiceImpl(Scheduler scheduler,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate mongoTemplate,
                             WidgetRepository widgetRepository) {
        super(scheduler, mongoConverter, mongoTemplate, widgetRepository);
        this.widgetRepository = widgetRepository;
    }

    @Override
    public Mono<Widget> getByName(String name) {
        return widgetRepository.findByName(name);
    }

}
