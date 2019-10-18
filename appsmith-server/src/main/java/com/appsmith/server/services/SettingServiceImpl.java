package com.appsmith.server.services;

import com.appsmith.server.domains.Setting;
import com.appsmith.server.repositories.SettingRepository;
import com.segment.analytics.Analytics;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class SettingServiceImpl extends BaseService<SettingRepository, Setting, String> implements SettingService {

    private final SettingRepository repository;

    @Autowired
    public SettingServiceImpl(Scheduler scheduler,
                              Validator validator,
                              MongoConverter mongoConverter,
                              ReactiveMongoTemplate reactiveMongoTemplate,
                              SettingRepository repository,
                              AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
    }

    @Override
    public Mono<Setting> getByKey(String key) {
        return repository.findByKey(key);
    }
}
