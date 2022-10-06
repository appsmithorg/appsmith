package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.EnvironmentVariable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import com.appsmith.server.services.*;
import com.appsmith.server.repositories.EnvironmentVariableRepository;


import javax.validation.Validator;
import java.util.List;
import java.util.Map;

@Slf4j
public class EnvironmentVariableServiceCEImpl extends BaseService<EnvironmentVariableRepository, EnvironmentVariable, String> implements EnvironmentVariableServiceCE {

    @Autowired
    public EnvironmentVariableServiceCEImpl(Scheduler scheduler,
                                            Validator validator,
                                            MongoConverter mongoConverter,
                                            ReactiveMongoTemplate reactiveMongoTemplate,
                                            EnvironmentVariableRepository repository,
                                            AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);

    }

    // read
    @Override
    public Mono<EnvironmentVariable> findById(String id, AclPermission aclPermission) {
        return  repository.findById(id, aclPermission);
    }

    @Override
    public Flux<EnvironmentVariable> findByApplicationId(String id, AclPermission aclPermission) {
        return  repository.findByApplicationId(id, aclPermission);
    }

    @Override
    public Flux<EnvironmentVariable> findAllByIds(List<String> ids, AclPermission aclPermission) {
        return repository.findAllByIds(ids, aclPermission);
    }

    @Override
    public Flux<EnvironmentVariable> findByEnvironmentId (String envId, AclPermission aclPermission) {
        return repository.findByEnvironmentId(envId, aclPermission);
    }

    // Write
    @Override
    public Mono<EnvironmentVariable> save(EnvironmentVariable envVariable) {
        return repository.save(envVariable);
    }

    @Override
    public Flux<EnvironmentVariable> saveAll(List<EnvironmentVariable> envVariables) {
        return repository.saveAll(envVariables);
    }

    // Delete/Archive

    @Override
    public Mono<EnvironmentVariable> archive(EnvironmentVariable envVariable) {
        return repository.archive(envVariable);
    }


    @Override
    public Mono<EnvironmentVariable> archiveById(String id) {
        return super.archiveById(id);
    }

    // Update
    @Override
    public Mono<EnvironmentVariable> update(String id, EnvironmentVariable envVariable) {
        return super.update(id, envVariable);
    }

}
