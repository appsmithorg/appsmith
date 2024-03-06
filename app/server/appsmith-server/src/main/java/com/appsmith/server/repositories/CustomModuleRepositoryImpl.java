package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.QModule;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomModuleRepositoryImpl extends BaseAppsmithRepositoryImpl<Module> implements CustomModuleRepository {

    public CustomModuleRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<Module> getAllModulesByPackageId(String packageId, AclPermission permission) {
        Criteria packageCriteria = where(Module.Fields.packageId).is(packageId);

        return queryBuilder().criteria(packageCriteria).permission(permission).all();
    }

    @Override
    public Flux<Module> getAllModulesByPackageIds(
            List<String> packageIds, List<String> projectionFields, Optional<AclPermission> permissionOptional) {
        Criteria packageIdsCriteria = where(Module.Fields.packageId).in(packageIds);

        return queryBuilder()
                .criteria(packageIdsCriteria)
                .fields(Optional.ofNullable(projectionFields).orElse(null))
                .permission(permissionOptional.orElse(null))
                .all();
    }

    @Override
    public Flux<Module> getAllConsumableModulesByPackageIds(List<String> packageIds, AclPermission permission) {
        Criteria packageIdInCriteria = where(Module.Fields.packageId).in(packageIds);
        return queryBuilder()
                .criteria(packageIdInCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public Mono<Module> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission permission, ResourceModes resourceModes) {
        String layoutsIdKey;
        String layoutsKey;

        List<Criteria> criteria = new ArrayList<>();
        Criteria idCriterion = getIdCriteria(id);
        criteria.add(idCriterion);

        if (ResourceModes.VIEW.equals(resourceModes)) {
            layoutsKey = Module.Fields.publishedModule + "." + fieldName(QModule.module.publishedModule.layouts);
        } else {
            layoutsKey = Module.Fields.unpublishedModule + "." + fieldName(QModule.module.unpublishedModule.layouts);
        }
        layoutsIdKey = layoutsKey + "." + FieldName.ID;

        Criteria layoutCriterion = where(layoutsIdKey).is(layoutId);
        criteria.add(layoutCriterion);

        return queryBuilder().criteria(criteria).permission(permission).one();
    }

    @Override
    public Flux<Module> findAllByIds(
            Set<String> ids, List<String> projectionFields, Optional<AclPermission> permission) {
        Criteria idCriteria = where(Module.Fields.id).in(ids);
        return queryBuilder()
                .criteria(idCriteria)
                .fields(Optional.ofNullable(projectionFields).orElse(null))
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Mono<Module> findConsumableModuleByPackageIdAndOriginModuleId(
            String packageId, String originModuleId, Optional<AclPermission> permission) {
        List<Criteria> criteria = new ArrayList<>();
        Criteria packageIdAndOriginModuleIdCriterion = where(Module.Fields.packageId)
                .is(packageId)
                .and(Module.Fields.originModuleId)
                .is(originModuleId);

        criteria.add(packageIdAndOriginModuleIdCriterion);
        return queryBuilder()
                .criteria(criteria)
                .permission(permission.orElse(null))
                .one();
    }

    @Override
    public Flux<Module> findAllByOriginModuleId(
            String originModuleId, List<String> projectionFields, Optional<AclPermission> permissionOptional) {
        List<Criteria> criteria = new ArrayList<>();
        Criteria originModuleIdCriterion = where(Module.Fields.originModuleId).is(originModuleId);

        criteria.add(originModuleIdCriterion);
        return queryBuilder()
                .criteria(criteria)
                .fields(Optional.ofNullable(projectionFields).orElse(null))
                .permission(permissionOptional.orElse(null))
                .all();
    }

    @Override
    public Flux<Module> findAllByModuleUUID(String moduleUUID, Optional<AclPermission> permission) {
        List<Criteria> criteria = new ArrayList<>();
        Criteria moduleUUIDCriterion = Criteria.where(Module.Fields.moduleUUID).is(moduleUUID);
        criteria.add(moduleUUIDCriterion);

        return queryBuilder()
                .criteria(criteria)
                .permission(permission.orElse(null))
                .all();
    }
}
