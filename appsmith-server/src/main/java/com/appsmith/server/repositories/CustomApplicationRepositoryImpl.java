package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.helpers.PolicyUtils;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomApplicationRepositoryImpl extends BaseAppsmithRepositoryImpl<Application>
        implements CustomApplicationRepository {

    private final PolicyUtils policyUtils;

    @Autowired
    public CustomApplicationRepositoryImpl(@NonNull ReactiveMongoOperations mongoOperations,
                                           @NonNull MongoConverter mongoConverter, PolicyUtils policyUtils) {
        super(mongoOperations, mongoConverter, policyUtils);
        this.policyUtils = policyUtils;
    }

    protected Criteria getIdCriteria(Object id) {
        return where(fieldName(QApplication.application.id)).is(id);
    }

    @Override
    public Mono<Application> findByIdAndOrganizationId(String id, String orgId, AclPermission permission) {
        Criteria orgIdCriteria = where(fieldName(QApplication.application.organizationId)).is(orgId);
        Criteria idCriteria = getIdCriteria(id);

        return queryOne(List.of(idCriteria, orgIdCriteria), permission);
    }

    @Override
    public Mono<Application> findByName(String name, AclPermission permission) {
        Criteria nameCriteria = where(fieldName(QApplication.application.name)).is(name);
        return queryOne(List.of(nameCriteria), permission);
    }

    @Override
    public Flux<Application> findByOrganizationId(String orgId, AclPermission permission) {
        Criteria orgIdCriteria = where(fieldName(QApplication.application.organizationId)).is(orgId);
        return queryAll(List.of(orgIdCriteria), permission);
    }

    @Override
    public Flux<Application> findByMultipleOrganizationIds(Set<String> orgIds, AclPermission permission) {
        Criteria orgIdsCriteria = where(fieldName(QApplication.application.organizationId)).in(orgIds);
        return queryAll(List.of(orgIdsCriteria), permission);
    }
}
