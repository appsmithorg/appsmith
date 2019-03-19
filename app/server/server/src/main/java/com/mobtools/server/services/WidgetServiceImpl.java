package com.mobtools.server.services;

import com.mobtools.server.domains.Widget;
import com.mobtools.server.repositories.WidgetRepository;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
@Slf4j
public class WidgetServiceImpl extends BaseService implements WidgetService {

    private WidgetRepository widgetRepository;

    private final MongoConverter mongoConverter;

    private final ReactiveMongoTemplate mongoTemplate;

    @Autowired
    public WidgetServiceImpl(Scheduler scheduler, WidgetRepository widgetRepository, MongoConverter mongoConverter, ReactiveMongoTemplate mongoTemplate) {
        super(scheduler);
        this.widgetRepository = widgetRepository;
        this.mongoConverter = mongoConverter;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Mono<Widget> getByName(String name) {
        return widgetRepository.findByName(name);

    }

    @Override
    public Flux<Widget> get() {
        return widgetRepository.findAll();
    }

    @Override
    public Mono<Widget> create(Widget widget) {

        return widgetRepository.save(widget);

    }

    @Override
    public Mono<Widget> update(String id, Widget widget) throws Exception {
        if (id == null) {
            throw new Exception("Invalid id provided");
        }

        Query query = new Query();
        query.addCriteria(Criteria.where("id").is(id));

        Update updateObj = new Update();

//        DBObject update = getDbObject(widget);
//        Map<String, Object> updateMap = update.toMap();
//        updateMap.entrySet().stream().forEach(entry -> {
//            updateObj.set(entry.getKey(), entry.getValue());
//        });
        updateObj.set("name", "testName");
        mongoTemplate.updateFirst(query,updateObj, Widget.class);
        return widgetRepository.save(widget);

    }

    private DBObject getDbObject(Object o) {
        BasicDBObject basicDBObject = new BasicDBObject();
        mongoConverter.write(o, basicDBObject);
        return basicDBObject;
    }
}
