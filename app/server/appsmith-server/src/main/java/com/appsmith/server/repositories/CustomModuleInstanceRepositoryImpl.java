package com.appsmith.server.repositories;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.QModuleInstance;
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
    public Mono<Long> getModuleInstanceCountByModuleUUID(String moduleUUID, String workspaceId) {
        Criteria moduleIdCriteria = where(ModuleInstance.Fields.moduleUUID)
                .is(moduleUUID)
                .and(ModuleInstance.Fields.workspaceId)
                .is(workspaceId);

        return queryBuilder().criteria(moduleIdCriteria).count();
    }

    @Override
    public Flux<ModuleInstance> findAllPublishedByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission) {
        Criteria contextIdAndContextTypeCriteria = where(publishedContextTypeToContextIdPathMap.get(contextType))
                .is(contextId)
                .and(completeFieldName(QModuleInstance.moduleInstance.publishedModuleInstance.contextType))
                .is(contextType);

        return queryBuilder()
                .criteria(contextIdAndContextTypeCriteria)
                .permission(Optional.ofNullable(permission).orElse(null))
                .all();
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

        return queryBuilder()
                .criteria(criteria)
                .permission(Optional.ofNullable(permission).orElse(null))
                .all();
    }

    @Override
    public Mono<ModuleInstance> findByBranchNameAndDefaultModuleInstanceId(
            String branchName, String defaultModuleInstanceId, AclPermission permission) {
        final String defaultResources = ModuleInstance.Fields.defaultResources;
        Criteria defaultModuleInstanceIdCriteria =
                where(defaultResources + "." + FieldName.MODULE_INSTANCE_ID).is(defaultModuleInstanceId);
        Criteria branchCriteria =
                where(defaultResources + "." + FieldName.BRANCH_NAME).is(branchName);
        return queryBuilder()
                .criteria(defaultModuleInstanceIdCriteria, branchCriteria)
                .permission(permission)
                .one();
    }

    @Override
    public Flux<ModuleInstance> findAllByRootModuleInstanceId(
            String rootModuleInstanceId, List<String> projectionFields, Optional<AclPermission> permission) {
        Criteria rootModuleInstanceIdCriterion =
                where(ModuleInstance.Fields.rootModuleInstanceId).is(rootModuleInstanceId);

        return queryBuilder()
                .criteria(rootModuleInstanceIdCriterion)
                .fields(Optional.ofNullable(projectionFields).orElse(null))
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Flux<ModuleInstance> findAllByApplicationIds(List<String> applicationIds, List<String> includedFields) {
        Criteria applicationCriteria =
                Criteria.where(ModuleInstance.Fields.applicationId).in(applicationIds);
        return queryBuilder()
                .criteria(applicationCriteria)
                .fields(includedFields)
                .all();
    }

    @Override
    public Flux<ModuleInstance> findAllByApplicationId(String applicationId, Optional<AclPermission> permission) {
        Criteria applicationIdCriterion =
                where(ModuleInstance.Fields.applicationId).is(applicationId);
        List<Criteria> criteria = new ArrayList<>();
        criteria.add(applicationIdCriterion);
        return queryBuilder()
                .criteria(criteria)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Mono<Void> archiveDeletedUnpublishedModuleInstances(String applicationId, AclPermission permission) {
        Criteria applicationIdCriterion =
                where(ModuleInstance.Fields.applicationId).is(applicationId);
        String unpublishedDeletedAtFieldName = String.format(
                "%s.%s",
                ModuleInstance.Fields.unpublishedModuleInstance,
                fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.deletedAt));
        Criteria deletedFromUnpublishedCriteria =
                where(unpublishedDeletedAtFieldName).ne(null);

        Update update = new Update();
        update.set(FieldName.DELETED, true);
        update.set(FieldName.DELETED_AT, Instant.now());
        return queryBuilder()
                .criteria(applicationIdCriterion, deletedFromUnpublishedCriteria)
                .permission(permission)
                .updateAll(update)
                .then();
    }

    @Override
    public Flux<ModuleInstance> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        Criteria pageIdCriteria = where(
                        completeFieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.pageId))
                .in(pageIds);

        return queryBuilder()
                .criteria(pageIdCriteria)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Flux<ModuleInstance> findAllByModuleIds(List<String> contextIds, AclPermission permission) {
        Criteria pageIdCriteria = where(
                        completeFieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.moduleId))
                .in(contextIds);

        return queryBuilder().criteria(pageIdCriteria).permission(permission).all();
    }

    @Override
    public Flux<ModuleInstance> findAllUnpublishedByOriginModuleIdOrModuleUUID(
            Module sourceModule, Optional<AclPermission> permission, String workspaceId) {
        List<Criteria> criteria = new ArrayList<>();
        Criteria originModuleIdCriterion = new Criteria()
                .orOperator(
                        where(ModuleInstance.Fields.originModuleId).is(sourceModule.getOriginModuleId()),
                        new Criteria()
                                .andOperator(
                                        where(ModuleInstance.Fields.originModuleId)
                                                .isNull(),
                                        where(ModuleInstance.Fields.moduleUUID).is(sourceModule.getModuleUUID()),
                                        where(ModuleInstance.Fields.workspaceId).is(workspaceId)));

        Criteria notDeletedCriterion = where(ModuleInstance.Fields.unpublishedModuleInstance + "."
                        + fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.deletedAt))
                .is(null);

        criteria.add(originModuleIdCriterion);
        criteria.add(notDeletedCriterion);

        return queryBuilder()
                .criteria(criteria)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Flux<ModuleInstance> findByDefaultApplicationId(
            String defaultApplicationId, Optional<AclPermission> permissionOptional) {
        final String defaultResources = ModuleInstance.Fields.defaultResources;
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        return queryBuilder()
                .criteria(defaultAppIdCriteria)
                .permission(permissionOptional.orElse(null))
                .all();
    }

    @Override
    public Mono<Long> getModuleInstanceCountByApplicationId(String applicationId, Optional<AclPermission> permission) {
        Criteria moduleIdCriteria = where(ModuleInstance.Fields.applicationId).is(applicationId);

        return queryBuilder()
                .criteria(moduleIdCriteria)
                .permission(permission.orElse(null))
                .count();
    }

    @Override
    public Flux<ModuleInstance> findAllUncomposedByApplicationIds(
            List<String> applicationIds, List<String> projectionFields) {
        Criteria applicationCriteria =
                Criteria.where(ModuleInstance.Fields.applicationId).in(applicationIds);

        Criteria notComposedCriteria =
                Criteria.where(ModuleInstance.Fields.rootModuleInstanceId).exists(false);

        return queryBuilder()
                .criteria(applicationCriteria, notComposedCriteria)
                .fields(projectionFields)
                .all();
    }
}
