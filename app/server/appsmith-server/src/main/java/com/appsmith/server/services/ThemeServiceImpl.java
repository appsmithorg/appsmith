package com.appsmith.server.services;

import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.ce.ThemeServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
public class ThemeServiceImpl extends ThemeServiceCEImpl implements ThemeService {
    public ThemeServiceImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ThemeRepository repository, AnalyticsService analyticsService, ApplicationRepository applicationRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService, applicationRepository);
    }
}
