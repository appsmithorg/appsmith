package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.QDatasource;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
public class CustomDatasourceRepositoryImpl extends BaseAppsmithRepositoryImpl<Datasource> implements CustomDatasourceRepository {

    public CustomDatasourceRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Flux<Datasource> findAllByOrganizationId(String organizationId, AclPermission permission) {
        Criteria orgIdCriteria = where(fieldName(QDatasource.datasource.organizationId)).is(organizationId);
        return queryAll(List.of(orgIdCriteria), permission);
    }

    @Override
    public Mono<Datasource> findByName(String name, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QDatasource.datasource.name)).is(name);
        return queryOne(List.of(nameCriteria), aclPermission);
    }
}
