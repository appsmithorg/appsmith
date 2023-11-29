package com.appsmith.server.repositories;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.QModuleInstance;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomModuleInstanceRepositoryImpl extends BaseAppsmithRepositoryImpl<ModuleInstance>
        implements CustomModuleInstanceRepository {

    private final Map<CreatorContextType, String> contextTypeToContextIdPathMap = Map.of(
            CreatorContextType.PAGE, fieldName(QModuleInstance.moduleInstance.pageId),
            CreatorContextType.MODULE, fieldName(QModuleInstance.moduleInstance.moduleId));

    public CustomModuleInstanceRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<Long> getModuleInstanceCountByModuleId(String moduleId) {
        Criteria moduleIdCriteria =
                where(fieldName(QModuleInstance.moduleInstance.sourceModuleId)).is(moduleId);

        return count(List.of(moduleIdCriteria), Optional.empty());
    }

    @Override
    public Flux<ModuleInstance> findAllByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission) {
        Criteria contextIdAndContextTypeCriteria = where(contextTypeToContextIdPathMap.get(contextType))
                .is(contextId)
                .and(fieldName(QModuleInstance.moduleInstance.contextType))
                .is(contextType);

        return queryAll(List.of(contextIdAndContextTypeCriteria), Optional.of(permission));
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
}
