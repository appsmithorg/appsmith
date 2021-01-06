package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.QLayout;
import com.appsmith.server.domains.QNewPage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomNewPageRepositoryImpl extends BaseAppsmithRepositoryImpl<NewPage>
        implements CustomNewPageRepository {

    public CustomNewPageRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Flux<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission) {
        Criteria applicationIdCriteria = where(fieldName(QNewPage.newPage.applicationId)).is(applicationId);
        return queryAll(List.of(applicationIdCriteria), aclPermission);
    }

    @Override
    public Mono<NewPage> findByIdAndLayoutsIdAndViewMode(String id, String layoutId, AclPermission aclPermission, Boolean viewMode) {
        Criteria idCriterion = getIdCriteria(id);
        String layoutsIdKey;
        String layoutsKey;

        if (Boolean.TRUE.equals(viewMode)) {
            layoutsKey = fieldName(QNewPage.newPage.publishedPage) + "." + fieldName(QNewPage.newPage.publishedPage.layouts);
        } else {
            layoutsKey = fieldName(QNewPage.newPage.unpublishedPage) + "." + fieldName(QNewPage.newPage.unpublishedPage.layouts);
        }
        layoutsIdKey = layoutsKey + "." + fieldName(QLayout.layout.id);

        Criteria layoutCriterion = where(layoutsIdKey).is(layoutId);

        List<Criteria> criteria = List.of(idCriterion, layoutCriterion);
        return queryOne(criteria, aclPermission);
    }

    @Override
    public Mono<NewPage> findByNameAndViewMode(String name, AclPermission aclPermission, Boolean viewMode) {
        Criteria nameCriterion = getNameCriterion(name, viewMode);

        return queryOne(List.of(nameCriterion), aclPermission);
    }

    @Override
    public Mono<NewPage> findByNameAndApplicationIdAndViewMode(String name, String applicationId, AclPermission aclPermission, Boolean viewMode) {
        Criteria nameCriterion = getNameCriterion(name, viewMode);

        Criteria applicationIdCriterion = where(fieldName(QNewPage.newPage.applicationId)).is(applicationId);

        return queryOne(List.of(nameCriterion, applicationIdCriterion), aclPermission);
    }

    @Override
    public Flux<NewPage> findAllByIds(List<String> ids, AclPermission aclPermission) {
        Criteria idsCriterion = where("id")
                .in(ids);

        return queryAll(List.of(idsCriterion), aclPermission);
    }

    private Criteria getNameCriterion(String name, Boolean viewMode) {
        String nameKey;

        if (Boolean.TRUE.equals(viewMode)) {
            nameKey = fieldName(QNewPage.newPage.publishedPage) + "." + fieldName(QNewPage.newPage.publishedPage.name);
        } else {
            nameKey = fieldName(QNewPage.newPage.unpublishedPage) + "." + fieldName(QNewPage.newPage.unpublishedPage.name);
        }
        return where(nameKey).is(name);
    }
}
