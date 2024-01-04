package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.QLayout;
import com.appsmith.server.domains.QModule;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
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
        Criteria packageCriteria = where(fieldName(QModule.module.packageId)).is(packageId);

        return queryAll(List.of(packageCriteria), permission);
    }

    @Override
    public Flux<Module> getAllConsumableModulesByPackageIds(List<String> packageIds, AclPermission permission) {
        Criteria packageIdInCriteria =
                where(fieldName(QModule.module.packageId)).in(packageIds);
        return queryAll(List.of(packageIdInCriteria), Optional.of(permission));
    }

    @Override
    public Mono<UpdateResult> update(String id, Update updateObj, AclPermission permission) {
        return updateById(id, updateObj, permission);
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
            layoutsKey =
                    fieldName(QModule.module.publishedModule) + "." + fieldName(QModule.module.publishedModule.layouts);
        } else {
            layoutsKey = fieldName(QModule.module.unpublishedModule) + "."
                    + fieldName(QModule.module.unpublishedModule.layouts);
        }
        layoutsIdKey = layoutsKey + "." + fieldName(QLayout.layout.id);

        Criteria layoutCriterion = where(layoutsIdKey).is(layoutId);
        criteria.add(layoutCriterion);

        return queryOne(criteria, permission);
    }

    @Override
    public Flux<Module> findAllByIds(
            Set<String> ids, List<String> projectionFields, Optional<AclPermission> permission) {
        Criteria idCriteria = where(fieldName(QModule.module.id)).in(ids);
        return queryAll(
                List.of(idCriteria),
                Optional.ofNullable(projectionFields),
                permission,
                Optional.empty(),
                NO_RECORD_LIMIT);
    }

    @Override
    public Mono<Module> findConsumableModuleByPackageIdAndOriginModuleId(
            String packageId, String originModuleId, Optional<AclPermission> permission) {
        List<Criteria> criteria = new ArrayList<>();
        Criteria packageIdAndOriginModuleIdCriterion = where(fieldName(QModule.module.packageId))
                .is(packageId)
                .and(fieldName(QModule.module.originModuleId))
                .is(originModuleId);

        criteria.add(packageIdAndOriginModuleIdCriterion);
        return queryOne(criteria, null, permission);
    }
}
