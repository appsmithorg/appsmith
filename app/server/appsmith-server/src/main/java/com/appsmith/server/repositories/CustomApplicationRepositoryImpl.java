package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.QApplication;
import com.mongodb.client.result.UpdateResult;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
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

    @Autowired
    public CustomApplicationRepositoryImpl(@NonNull ReactiveMongoOperations mongoOperations,
                                           @NonNull MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
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

    @Override
    public Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission) {
        Criteria clonedFromCriteria = where(fieldName(QApplication.application.clonedFromApplicationId)).is(applicationId);
        return queryAll(List.of(clonedFromCriteria), permission);
    }

    @Override
    public Mono<UpdateResult> addPageToApplication(String applicationId, String pageId, boolean isDefault, Integer order) {
        final ApplicationPage applicationPage = new ApplicationPage(pageId, isDefault, order);
        return mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId)),
                new Update().addToSet(fieldName(QApplication.application.pages), applicationPage),
                Application.class
        );
    }

    @Override
    public Mono<UpdateResult> setPages(String applicationId, List<ApplicationPage> pages) {
        return mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId)),
                new Update().set(fieldName(QApplication.application.pages), pages),
                Application.class
        );
    }

    @Override
    public Mono<UpdateResult> setDefaultPage(String applicationId, String pageId) {
        // Since this can only happen during edit, the page in question is unpublished page. Hence the update should
        // be to pages and not publishedPages

        final Mono<UpdateResult> setAllAsNonDefaultMono = mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId)).addCriteria(Criteria.where("pages.isDefault").is(true)),
                new Update().set("pages.$.isDefault", false),
                Application.class
        );

        final Mono<UpdateResult> setDefaultMono = mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId)).addCriteria(Criteria.where("pages._id").is(new ObjectId(pageId))),
                new Update().set("pages.$.isDefault", true),
                Application.class
        );

        return setAllAsNonDefaultMono.then(setDefaultMono);
    }

}
