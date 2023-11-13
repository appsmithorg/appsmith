package com.appsmith.server.packages.publish;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.Policy;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PublishingMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.PackageUtils;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.publish.publishable.PackagePublishableService;
import com.appsmith.server.repositories.PackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PublishPackageServiceImpl extends PublishPackageCECompatibleServiceImpl implements PublishPackageService {
    private final PackageRepository packageRepository;
    private final PackagePermission packagePermission;
    private final PackagePublishableService<Module> modulePublishableService;
    private final PackagePublishableService<NewAction> newActionPublishableService;
    private final PackagePublishableService<ActionCollection> actionCollectionPackagePublishableService;
    private final TransactionalOperator transactionalOperator;

    public PublishPackageServiceImpl(
            PackageRepository packageRepository,
            PackagePermission packagePermission,
            PackagePublishableService<Module> modulePublishableService,
            PackagePublishableService<NewAction> newActionPublishableService,
            PackagePublishableService<ActionCollection> actionCollectionPackagePublishableService,
            TransactionalOperator transactionalOperator) {
        this.packageRepository = packageRepository;
        this.packagePermission = packagePermission;
        this.modulePublishableService = modulePublishableService;
        this.newActionPublishableService = newActionPublishableService;
        this.actionCollectionPackagePublishableService = actionCollectionPackagePublishableService;
        this.transactionalOperator = transactionalOperator;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<Boolean> publishPackage(String packageId) {
        return packageRepository
                .findById(packageId, packagePermission.getPublishPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE_ID, packageId)))
                .flatMap(originalPackage -> {
                    int[] currentRawVersion = PackageUtils.parseVersion(originalPackage.getVersion());
                    String nextVersion = PackageUtils.getNextVersion(
                            currentRawVersion[0], currentRawVersion[1], currentRawVersion[2]);

                    // construct the package that's going to be published
                    Package pkgToBePublished = constructPackageToBePublished(originalPackage, nextVersion);

                    // set the next version to the original package, so that the original package can always tell what's
                    // the latest version and when did it get published
                    originalPackage.setVersion(nextVersion);
                    originalPackage.setLastPublishedAt(pkgToBePublished.getLastPublishedAt());

                    PublishingMetaDTO publishingMetaDTO = new PublishingMetaDTO();
                    publishingMetaDTO.setSourcePackageId(packageId);

                    Mono<Package> saveOriginalPackage = packageRepository.save(originalPackage);
                    Mono<Package> savePackageToBePublished = packageRepository.save(pkgToBePublished);

                    return Mono.zip(saveOriginalPackage, savePackageToBePublished)
                            .flatMap(tuple2 -> {
                                Package publishedPkg = tuple2.getT2();
                                publishingMetaDTO.setPublishedPackage(publishedPkg);

                                return modulePublishableService
                                        .getPublishableEntities(publishingMetaDTO)
                                        .flatMap(publishedModules -> {
                                            if (publishedModules.size() == 0) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.PACKAGE_CANNOT_BE_PUBLISHED,
                                                        originalPackage
                                                                .getUnpublishedPackage()
                                                                .getName()));
                                            }
                                            return newActionPublishableService
                                                    .getPublishableEntities(publishingMetaDTO)
                                                    .then(
                                                            actionCollectionPackagePublishableService
                                                                    .getPublishableEntities(publishingMetaDTO))
                                                    .thenReturn(Boolean.TRUE);
                                        });
                            });
                })
                .as(transactionalOperator::transactional);
    }

    private Package constructPackageToBePublished(Package sourcePkg, String nextVersion) {
        Package pkgToBePublished = new Package();
        AppsmithBeanUtils.copyNestedNonNullProperties(sourcePkg, pkgToBePublished);
        pkgToBePublished.setPublishedPackage(sourcePkg.getUnpublishedPackage());
        pkgToBePublished.setUnpublishedPackage(new PackageDTO());
        pkgToBePublished.setSrcPackageId(sourcePkg.getId());
        pkgToBePublished.setVersion(nextVersion);
        pkgToBePublished.setLastPublishedAt(Instant.now());
        pkgToBePublished.setId(null);

        // The published version of the package should only be readable and exportable
        Set<Policy> updatedPolicies = pkgToBePublished.getPolicies().stream()
                .filter(policy -> policy.getPermission()
                                .equals(packagePermission.getReadPermission().getValue())
                        || policy.getPermission()
                                .equals(packagePermission.getExportPermission().getValue()))
                .collect(Collectors.toSet());

        pkgToBePublished.setPolicies(updatedPolicies);

        return pkgToBePublished;
    }
}
