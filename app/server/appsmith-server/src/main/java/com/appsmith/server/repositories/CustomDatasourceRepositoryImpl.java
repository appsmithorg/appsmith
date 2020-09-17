package com.appsmith.server.repositories;

import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.QDatasource;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

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

    @Override
    public Mono<UpdateResult> saveStructure(String datasourceId, DatasourceStructure structure) {
        return mongoOperations.updateFirst(
                query(where(fieldName(QDatasource.datasource.id)).is(datasourceId)),
                Update.update(fieldName(QDatasource.datasource.structure), structure),
                Datasource.class
        );
    }

}
