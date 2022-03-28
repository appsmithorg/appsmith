package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.QDatasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

public class CustomDatasourceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Datasource> implements CustomDatasourceRepositoryCE {

    public CustomDatasourceRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Flux<Datasource> findAllByOrganizationId(String organizationId, AclPermission permission) {
        Criteria orgIdCriteria = where(fieldName(QDatasource.datasource.organizationId)).is(organizationId);
        return queryAll(List.of(orgIdCriteria), permission);
    }

    @Override
    public Mono<Datasource> findByNameAndOrganizationId(String name, String organizationId, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QDatasource.datasource.name)).is(name);
        Criteria orgIdCriteria = where(fieldName(QDatasource.datasource.organizationId)).is(organizationId);
        return queryOne(List.of(nameCriteria, orgIdCriteria), aclPermission);
    }

    @Override
    public Flux<Datasource> findAllByIds(Set<String> ids, AclPermission permission) {
        Criteria idcriteria = where(fieldName(QDatasource.datasource.id)).in(ids);
        return queryAll(List.of(idcriteria), permission);
    }

    public Mono<UpdateResult> saveStructure(String datasourceId, DatasourceStructure structure) {
        return mongoOperations.updateFirst(
                query(where(fieldName(QDatasource.datasource.id)).is(datasourceId)),
                Update.update(fieldName(QDatasource.datasource.structure), structure),
                Datasource.class
        );
    }
}
