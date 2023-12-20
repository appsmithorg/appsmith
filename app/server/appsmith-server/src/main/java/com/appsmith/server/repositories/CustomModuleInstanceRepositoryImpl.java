package com.appsmith.server.repositories;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.QModuleInstance;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomModuleInstanceRepositoryImpl extends BaseAppsmithRepositoryImpl<ModuleInstance>
        implements CustomModuleInstanceRepository {

    private final Map<CreatorContextType, String> publishedContextTypeToContextIdPathMap = Map.of(
            CreatorContextType.PAGE, completeFieldName(QModuleInstance.moduleInstance.publishedModuleInstance.pageId),
            CreatorContextType.MODULE,
                    completeFieldName(QModuleInstance.moduleInstance.publishedModuleInstance.moduleId));

    private final Map<CreatorContextType, String> unpublishedContextTypeToContextIdPathMap = Map.of(
            CreatorContextType.PAGE, completeFieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.pageId),
            CreatorContextType.MODULE,
                    completeFieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.moduleId));

    public CustomModuleInstanceRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<Long> getModuleInstanceCountByModuleUUID(String moduleUUID) {
        Criteria moduleIdCriteria =
                where(fieldName(QModuleInstance.moduleInstance.moduleUUID)).is(moduleUUID);

        return count(List.of(moduleIdCriteria), Optional.empty());
    }

    @Override
    public Flux<ModuleInstance> findAllPublishedByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission) {
        Criteria contextIdAndContextTypeCriteria = where(publishedContextTypeToContextIdPathMap.get(contextType))
                .is(contextId)
                .and(completeFieldName(QModuleInstance.moduleInstance.publishedModuleInstance.contextType))
                .is(contextType);

        return queryAll(List.of(contextIdAndContextTypeCriteria), Optional.of(permission));
    }

    @Override
    public Flux<ModuleInstance> findAllUnpublishedByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission) {
        List<Criteria> criteria = new ArrayList<>();
        Criteria contextIdAndContextTypeCriteria = where(unpublishedContextTypeToContextIdPathMap.get(contextType))
                .is(contextId)
                .and(completeFieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.contextType))
                .is(contextType);
        criteria.add(contextIdAndContextTypeCriteria);

        Criteria deletedAtNullCriterion = where(
                        completeFieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.deletedAt))
                .isNull();
        criteria.add(deletedAtNullCriterion);

        return queryAll(criteria, Optional.of(permission));
    }

    @Override
    public Mono<ModuleInstance> findByBranchNameAndDefaultModuleInstanceId(
            String branchName, String defaultModuleInstanceId, AclPermission permission) {
        final String defaultResources = fieldName(QModuleInstance.moduleInstance.defaultResources);
        Criteria defaultModuleInstanceIdCriteria =
                where(defaultResources + "." + FieldName.MODULE_INSTANCE_ID).is(defaultModuleInstanceId);
        Criteria branchCriteria =
                where(defaultResources + "." + FieldName.BRANCH_NAME).is(branchName);
        return queryOne(List.of(defaultModuleInstanceIdCriteria, branchCriteria), null, Optional.of(permission));
    }

    @Override
    public Flux<ModuleInstance> findAllByRootModuleInstanceId(
            String rootModuleInstanceId, Optional<AclPermission> permission) {
        Criteria rootModuleInstanceIdCriterion = where(fieldName(QModuleInstance.moduleInstance.rootModuleInstanceId))
                .is(rootModuleInstanceId);

        return queryAll(List.of(rootModuleInstanceIdCriterion), permission);
    }

    @Override
    public Flux<ModuleInstance> findAllByApplicationIds(List<String> applicationIds, List<String> includedFields) {
        Criteria applicationCriteria = Criteria.where(fieldName(QModuleInstance.moduleInstance.applicationId))
                .in(applicationIds);
        return queryAll(List.of(applicationCriteria), includedFields, null, null, NO_RECORD_LIMIT);
    }

    @Override
    public Flux<ModuleInstance> findAllByApplicationId(String applicationId, Optional<AclPermission> permission) {
        Criteria applicationIdCriterion =
                where(fieldName(QModuleInstance.moduleInstance.applicationId)).is(applicationId);
        List<Criteria> criteria = new ArrayList<>();
        criteria.add(applicationIdCriterion);
        return queryAll(criteria, permission);
    }

    @Override
    public Mono<UpdateResult> archiveDeletedUnpublishedModuleInstances(String applicationId, AclPermission permission) {
        Criteria applicationIdCriterion =
                where(fieldName(QModuleInstance.moduleInstance.applicationId)).is(applicationId);
        String unpublishedDeletedAtFieldName = String.format(
                "%s.%s",
                fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance),
                fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.deletedAt));
        Criteria deletedFromUnpublishedCriteria =
                where(unpublishedDeletedAtFieldName).ne(null);

        Update update = new Update();
        update.set(FieldName.DELETED, true);
        update.set(FieldName.DELETED_AT, Instant.now());
        return updateByCriteria(List.of(applicationIdCriterion, deletedFromUnpublishedCriteria), update, permission);
    }

    @Override
    public Flux<ModuleInstance> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        Criteria pageIdCriteria = where(
                        completeFieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.pageId))
                .in(pageIds);

        Criteria notAModuleInstancePrivateEntity = where(
                        completeFieldName(QModuleInstance.moduleInstance.rootModuleInstanceId))
                .exists(false);

        return queryAll(List.of(pageIdCriteria, notAModuleInstancePrivateEntity), permission);
    }

    @Override
    public Flux<ModuleInstance> findAllUnpublishedByModuleUUID(String moduleUUID, Optional<AclPermission> permission) {
        List<Criteria> criteria = new ArrayList<>();
        Criteria moduleUUIDCriterion =
                where(fieldName(QModuleInstance.moduleInstance.moduleUUID)).is(moduleUUID);

        Criteria notDeletedCriterion = where(fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance) + "."
                        + fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.deletedAt))
                .is(null);

        criteria.add(moduleUUIDCriterion);
        criteria.add(notDeletedCriterion);

        return queryAll(criteria, permission);
    }
}
