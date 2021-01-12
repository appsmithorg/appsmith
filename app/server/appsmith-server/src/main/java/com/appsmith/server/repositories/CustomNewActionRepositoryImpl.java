package com.appsmith.server.repositories;

import com.appsmith.external.models.QActionConfiguration;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomNewActionRepositoryImpl extends BaseAppsmithRepositoryImpl<NewAction>
        implements CustomNewActionRepository {

    public CustomNewActionRepositoryImpl(ReactiveMongoOperations mongoOperations,
                                         MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Mono<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.name)).is(name);
        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.pageId)).is(pageId);

        return queryOne(List.of(nameCriteria, pageCriteria), aclPermission);
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId, AclPermission aclPermission) {
        String unpublishedPage = fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.pageId);
        String publishedPage = fieldName(QNewAction.newAction.publishedAction) + "." + fieldName(QNewAction.newAction.publishedAction.pageId);

        Criteria pageCriteria = new Criteria().orOperator(
                where(unpublishedPage).is(pageId),
                where(publishedPage).is(pageId)
        );

        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .flatMapMany(auth -> {
                    User user = (User) auth.getPrincipal();
                    Query query = new Query();

                    if (aclPermission == null) {
                        query.addCriteria(new Criteria().andOperator(notDeleted(), pageCriteria));
                    } else {
                        query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(user, aclPermission), pageCriteria));
                    }

                    return mongoOperations.query(NewAction.class)
                            .matching(query)
                            .all()
                            .map(obj -> setUserPermissionsInObject(obj, user));
                });
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId) {
        return this.findByPageId(pageId, null);
    }

    @Override
    public Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission) {
        Criteria pageCriteria;

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {
            pageCriteria = where(fieldName(QNewAction.newAction.publishedAction) + "." + fieldName(QNewAction.newAction.publishedAction.pageId)).is(pageId);
        }
        // Fetch unpublished actions
        else {
            pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.pageId)).is(pageId);
        }
        return queryAll(List.of(pageCriteria), aclPermission);
    }

    @Override
    public Flux<NewAction> findUnpublishedActionsForRestApiOnLoad(
            Set<String> names,
            String pageId,
            String httpMethod,
            Boolean userSetOnLoad,
            AclPermission aclPermission) {
        Criteria namesCriteria = where(fieldName(QNewAction.newAction.unpublishedAction)
                + "."
                + fieldName(QNewAction.newAction.unpublishedAction.name))
                .in(names);

        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction)
                + "."
                + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                .is(pageId);

        Criteria userSetOnLoadCriteria = where(fieldName(QNewAction.newAction.unpublishedAction)
                + "."
                + fieldName(QNewAction.newAction.unpublishedAction.userSetOnLoad))
                .is(userSetOnLoad);

        String httpMethodQueryKey = fieldName(QNewAction.newAction.unpublishedAction)
                + "."
                + fieldName(QNewAction.newAction.unpublishedAction.actionConfiguration)
                + "."
                + fieldName(QActionConfiguration.actionConfiguration.httpMethod);

        Criteria httpMethodCriteria = where(httpMethodQueryKey).is(httpMethod);
        List<Criteria> criterias = List.of(namesCriteria, pageCriteria, httpMethodCriteria, userSetOnLoadCriteria);

        return queryAll(criterias, aclPermission);
    }

    @Override
    public Flux<NewAction> findAllActionsByNameAndPageIdsAndViewMode(String name,
                                                                     List<String> pageIds,
                                                                     Boolean viewMode,
                                                                     AclPermission aclPermission,
                                                                     Sort sort) {
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         */

        List<Criteria> criteriaList = new ArrayList<>();

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.publishedAction) + "." + fieldName(QNewAction.newAction.publishedAction.name)).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.publishedAction) + "." + fieldName(QNewAction.newAction.publishedAction.pageId)).in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.name)).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.pageId)).in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }

        return queryAll(criteriaList, aclPermission, sort);
    }

    @Override
    public Flux<NewAction> findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(Set<String> names,
                                                                                       String pageId,
                                                                                       AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();
        if (names != null) {
            Criteria namesCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.name)).in(names);
            criteriaList.add(namesCriteria);
        }
        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.pageId)).is(pageId);
        criteriaList.add(pageCriteria);

        Criteria executeOnLoadCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.executeOnLoad)).is(Boolean.TRUE);
        criteriaList.add(executeOnLoadCriteria);

        return queryAll(criteriaList, permission);
    }

    @Override
    public Flux<NewAction> findUnpublishedActionsByNameInAndPageId(Set<String> names, String pageId, AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();
        if (names != null) {
            Criteria namesCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.name)).in(names);
            criteriaList.add(namesCriteria);
        }
        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.pageId)).is(pageId);
        criteriaList.add(pageCriteria);

        return queryAll(criteriaList, permission);
    }

    @Override
    public Flux<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(String pageId, AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();

        Criteria executeOnLoadCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.executeOnLoad)).is(Boolean.TRUE);
        criteriaList.add(executeOnLoadCriteria);

        Criteria setByUserCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.userSetOnLoad)).is(Boolean.TRUE);
        criteriaList.add(setByUserCriteria);

        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.pageId)).is(pageId);
        criteriaList.add(pageCriteria);

        return queryAll(criteriaList, permission);
    }

    @Override
    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {

        Criteria applicationCriteria = where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);

        return queryAll(List.of(applicationCriteria), aclPermission, sort);
    }

    @Override
    public Flux<NewAction> findByApplicationIdAndViewMode(String applicationId,
                                                          Boolean viewMode,
                                                          AclPermission aclPermission) {

        Criteria applicationCriteria = where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);

        return queryAll(List.of(applicationCriteria), aclPermission);
    }

    @Override
    public Mono<Long> countByDatasourceId(String datasourceId) {
        Criteria unpublishedDatasourceCriteria = where(fieldName(QNewAction.newAction.unpublishedAction)
                + ".datasource._id")
                .is(new ObjectId(datasourceId));
        Criteria publishedDatasourceCriteria = where(fieldName(QNewAction.newAction.publishedAction)
                + ".datasource._id")
                .is(new ObjectId(datasourceId));

        Criteria datasourceCriteria = new Criteria().orOperator(unpublishedDatasourceCriteria, publishedDatasourceCriteria);

        Query query = new Query();
        query.addCriteria(datasourceCriteria);

        return mongoOperations.count(query, "newAction");
    }
}
