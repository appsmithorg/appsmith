package com.appsmith.server.services;

import com.appsmith.server.domains.Theme;
import com.appsmith.server.repositories.ThemeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
public class ThemeServiceImpl extends BaseService<ThemeRepository, Theme, String> implements ThemeService {

    public ThemeServiceImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ThemeRepository repository, AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Flux<Theme> get(MultiValueMap<String, String> params) {
        return repository.findAll();
    }

    @Override
    public Mono<Theme> create(Theme resource) {
        return null;
    }

    @Override
    public Mono<Theme> update(String s, Theme resource) {
        return null;
    }

    @Override
    public Mono<Theme> getById(String s) {
        return null;
    }
}
