package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QPackage;
import com.appsmith.server.dtos.ExportableModule;
import com.mongodb.client.result.UpdateResult;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomPackageRepositoryImpl extends BaseAppsmithRepositoryImpl<Package>
        implements CustomPackageRepository {

    public CustomPackageRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<Package> findAllEditablePackages(AclPermission permission) {
        Criteria onlyUnpublishedPackages = where(completeFieldName(QPackage.package$.publishedPackage.name))
                .exists(false);
        return queryAll(List.of(onlyUnpublishedPackages), Optional.ofNullable(permission));
    }

    @Override
    public Flux<Package> findAllConsumablePackages(String workspaceId, AclPermission permission) {
        Criteria criteria = where(fieldName(QPackage.package$.workspaceId))
                .is(workspaceId)
                .and(fieldName(QPackage.package$.latest))
                .is(true);

        return queryAll(List.of(criteria), Optional.of(permission));
    }

    @NotNull private Flux<Package> findAllOriginPackages(String workspaceId, Optional<AclPermission> permission) {
        Criteria originPackageCriteria = Criteria.where(fieldName(QPackage.package$.originPackageId))
                .is(null)
                .and(fieldName(QPackage.package$.lastPublishedAt))
                .ne(null)
                .and(fieldName(QPackage.package$.workspaceId))
                .is(workspaceId);

        return queryAll(List.of(originPackageCriteria), permission);
    }

    @Override
    public Mono<UpdateResult> update(String id, Update updateObj, AclPermission permission) {
        return updateById(id, updateObj, permission);
    }

    @Override
    public Mono<Package> findByBranchNameAndDefaultPackageId(
            String defaultPackageId,
            List<String> projectionFieldNames,
            String branchName,
            AclPermission aclPermission) {
        // TODO : Uncomment the below after git support
        //        String gitPackageMetadata = fieldName(QPackage.package$.gitPackageMetadata);
        //        Criteria defaultAppCriteria = where(gitPackageMetadata + "."
        //            + fieldName(QPackage.package$.gitPackageMetadata.defaultApplicationId))
        //            .is(defaultPackageId);
        //        Criteria branchNameCriteria = where(gitPackageMetadata + "."
        //            + fieldName(QPackage.package$.gitPackageMetadata.branchName))
        //            .is(branchName);
        //        return queryOne(List.of(defaultAppCriteria, branchNameCriteria), projectionFieldNames, aclPermission);
        return findById(defaultPackageId, projectionFieldNames, aclPermission);
    }

    @Override
    public Flux<Package> findAllByIds(List<String> packageIds, List<String> projectionFields) {
        Criteria idCriteria = where(fieldName(QPackage.package$.id)).in(packageIds);
        return queryAll(
                List.of(idCriteria),
                Optional.ofNullable(projectionFields),
                Optional.empty(),
                Optional.empty(),
                NO_RECORD_LIMIT);
    }

    @Override
    public Flux<Package> findAllPublishedByUniqueReference(
            String workspaceId, List<ExportableModule> packageList, Optional<AclPermission> aclPermission) {
        Criteria originPackageCriteria = Criteria.where(fieldName(QPackage.package$.originPackageId))
                .exists(true)
                .and(fieldName(QPackage.package$.workspaceId))
                .is(workspaceId);

        List<Criteria> criteriaList = packageList.stream()
                .map(aPackage -> {
                    return where(fieldName(QPackage.package$.packageUUID))
                            .is(aPackage.getPackageUUID())
                            .and(fieldName(QPackage.package$.version))
                            .is(aPackage.getVersion());
                })
                .toList();

        Criteria packageRefCriteria = new Criteria();
        if (!criteriaList.isEmpty()) {
            packageRefCriteria.orOperator(criteriaList);
        }

        return queryAll(List.of(originPackageCriteria, packageRefCriteria), aclPermission);
    }

    @Override
    public Mono<Package> findPackageByOriginPackageIdAndVersion(
            String originPackageId, String version, Optional<AclPermission> permission) {
        Criteria originPackageCriteria = Criteria.where(fieldName(QPackage.package$.originPackageId))
                .is(originPackageId)
                .and(fieldName(QPackage.package$.version))
                .is(version);

        return queryOne(List.of(originPackageCriteria), null, permission);
    }

    @Override
    public Flux<Package> findAllPackagesByWorkspaceId(
            String workspaceId, List<String> projectionFields, Optional<AclPermission> permissionOptional) {
        Criteria idCriteria = where(fieldName(QPackage.package$.workspaceId)).is(workspaceId);
        return queryAll(
                List.of(idCriteria),
                Optional.ofNullable(projectionFields),
                permissionOptional,
                Optional.empty(),
                NO_RECORD_LIMIT);
    }

    @Override
    public Mono<UpdateResult> unsetLatestPackageByOriginId(String originPackageId, AclPermission permission) {
        Criteria latestPackageCriteria =
                where(completeFieldName(QPackage.package$.latest)).is(true);
        Criteria originPackageIdCriteria =
                where(completeFieldName(QPackage.package$.originPackageId)).is(originPackageId);

        Update update = new Update();
        update.set(completeFieldName(QPackage.package$.latest), false);
        return updateByCriteria(List.of(latestPackageCriteria, originPackageIdCriteria), update, permission);
    }

    @Override
    public Mono<Package> findLatestPackageByOriginPackageId(
            String originPackageId, Optional<AclPermission> permission) {
        Criteria originPackageCriteria = Criteria.where(fieldName(QPackage.package$.originPackageId))
                .is(originPackageId)
                .and(fieldName(QPackage.package$.latest))
                .is(true);

        return queryOne(List.of(originPackageCriteria), null, permission);
    }

    @Override
    public Flux<Package> findAllByPackageUUID(String packageUUID, Optional<AclPermission> permission) {
        Criteria packageUUIDCriterion =
                Criteria.where(fieldName(QPackage.package$.packageUUID)).is(packageUUID);

        List<Criteria> criteria = new ArrayList<>();
        criteria.add(packageUUIDCriterion);
        return queryAll(criteria, permission);
    }
}
