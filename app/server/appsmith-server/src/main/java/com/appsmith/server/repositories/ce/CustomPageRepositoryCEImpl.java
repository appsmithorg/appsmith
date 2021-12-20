package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.QLayout;
import com.appsmith.server.domains.QPage;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomPageRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Page>
        implements CustomPageRepositoryCE {

    public CustomPageRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }


    @Override
    public Mono<Page> findByIdAndLayoutsId(String id, String layoutId, AclPermission aclPermission) {

        Criteria idCriteria = getIdCriteria(id);
        String layoutsIdKey = fieldName(QPage.page.layouts) + "." + fieldName(QLayout.layout.id);
        Criteria layoutCriteria = where(layoutsIdKey).is(layoutId);

        List<Criteria> criterias = List.of(idCriteria, layoutCriteria);
        return queryOne(criterias, aclPermission);
    }

    @Override
    public Mono<Page> findByName(String name, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QPage.page.name)).is(name);
        return queryOne(List.of(nameCriteria), aclPermission);
    }

    @Override
    public Flux<Page> findByApplicationId(String applicationId, AclPermission aclPermission) {
        Criteria applicationIdCriteria = where(fieldName(QPage.page.applicationId)).is(applicationId);
        return queryAll(List.of(applicationIdCriteria), aclPermission);
    }

    @Override
    public Mono<Page> findByNameAndApplicationId(String name, String applicationId, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QPage.page.name)).is(name);
        Criteria applicationIdCriteria = where(fieldName(QPage.page.applicationId)).is(applicationId);
        return queryOne(List.of(nameCriteria, applicationIdCriteria), aclPermission);
    }
}
