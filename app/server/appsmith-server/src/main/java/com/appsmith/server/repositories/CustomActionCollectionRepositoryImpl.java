package com.appsmith.server.repositories;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
public class CustomActionCollectionRepositoryImpl extends CustomActionCollectionRepositoryCEImpl
        implements CustomActionCollectionRepository {

    public CustomActionCollectionRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<ActionCollection> findAllByModuleIds(List<String> moduleIds, List<String> includeFields) {
        Criteria moduleIdCriteria = Criteria.where(
                        fieldName(QActionCollection.actionCollection.unpublishedCollection.moduleId))
                .in(moduleIds);
        return queryAll(List.of(moduleIdCriteria), includeFields, null, null, NO_RECORD_LIMIT);
    }

    @Override
    public Flux<ActionCollection> findAllUnpublishedComposedCollectionsByContextIdAndContextTypeAndModuleInstanceId(
            String contextId, CreatorContextType contextType, String moduleInstanceId, AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();

        String contextIdPath;
        if (CreatorContextType.PAGE.equals(contextType)) {

            contextIdPath = fieldName(QActionCollection.actionCollection.unpublishedCollection) + "."
                    + fieldName(QActionCollection.actionCollection.unpublishedCollection.pageId);
        } else {
            contextIdPath = fieldName(QActionCollection.actionCollection.unpublishedCollection) + "."
                    + fieldName(QActionCollection.actionCollection.unpublishedCollection.moduleId);
        }

        String contextTypePath = fieldName(QActionCollection.actionCollection.unpublishedCollection) + "."
                + fieldName(QActionCollection.actionCollection.unpublishedCollection.contextType);
        String moduleInstanceIdPath = fieldName(QActionCollection.actionCollection.unpublishedCollection) + "."
                + fieldName(QActionCollection.actionCollection.unpublishedCollection.rootModuleInstanceId);
        Criteria contextIdAndContextTypeAndModuleInstanceIdCriteria = where(contextIdPath)
                .is(contextId)
                .and(contextTypePath)
                .is(contextType)
                .and(moduleInstanceIdPath)
                .is(moduleInstanceId);

        criteriaList.add(contextIdAndContextTypeAndModuleInstanceIdCriteria);

        return queryAll(criteriaList, Optional.of(permission));
    }
}
