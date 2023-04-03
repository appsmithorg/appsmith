package com.appsmith.server.services;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.BaseRepository;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;

import java.io.Serializable;

@Slf4j
public abstract class BranchAwareBaseService<R extends BaseRepository<T, ID> & AppsmithRepository<T>, T extends BranchAwareDomain, ID extends Serializable>
        extends BaseService<R, T, ID> {
            
            public BranchAwareBaseService(Scheduler scheduler, Validator validator, MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate, R repository, AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        //TODO Auto-generated constructor stub
    }
}
