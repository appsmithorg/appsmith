package com.appsmith.server.moduleinstances.moduleconvertible;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ModuleType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ConvertToModuleRequestDTO;
import com.appsmith.server.dtos.CreateExistingEntityToModuleResponseDTO;
import com.appsmith.server.dtos.ModuleConvertibleMetaDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.moduleconvertible.ModuleConvertibleService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.packages.permissions.PackagePermissionChecker;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RequiredArgsConstructor
@Service
public class EntityToModuleConverterServiceImpl extends EntityToModuleConverterServiceCECompatibleImpl
        implements EntityToModuleConverterService {
    private static final Pattern PACKAGE_NAME_PATTERN = Pattern.compile("^Untitled Package (\\d+)$");
    private final CrudPackageService crudPackageService;
    private final PackagePermissionChecker packagePermissionChecker;
    private final ModuleConvertibleService<NewAction, NewAction> queryModuleConvertibleService;
    private final PackagePermission packagePermission;

    @Override
    public Mono<CreateExistingEntityToModuleResponseDTO> convertExistingEntityToModule(
            ConvertToModuleRequestDTO convertToModuleRequestDTO, String branchName) {
        // A momentary check until we build this feature for the other types
        if (!ModuleType.QUERY_MODULE.equals(convertToModuleRequestDTO.getModuleType())) {
            return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
        }
        if (ValidationUtils.isEmptyParam(convertToModuleRequestDTO.getPublicEntityId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "publicEntityId"));
        }

        Mono<Reusable> publicEntityCandidateMono = queryModuleConvertibleService
                .getPublicEntityCandidateMono(convertToModuleRequestDTO.getPublicEntityId())
                .cache();

        // If `packageId` is `null` we will create a new package following naming convention of the package
        Mono<PackageDTO> sourcePackageMono;
        if (ValidationUtils.isEmptyParam(convertToModuleRequestDTO.getPackageId())) {
            sourcePackageMono = publicEntityCandidateMono.flatMap(reusable -> {
                ActionDTO actionDTO = (ActionDTO) reusable;
                return getExistingPackageNames(actionDTO.getWorkspaceId())
                        .map(takenNames -> {
                            int currentHighestPackageNumber = findHighestPackageNumber(takenNames);
                            PackageDTO packageReqDTO = new PackageDTO();
                            packageReqDTO.setName("Untitled Package " + ++currentHighestPackageNumber);
                            return packageReqDTO;
                        })
                        .flatMap(packageReqDTO ->
                                crudPackageService.createPackage(packageReqDTO, actionDTO.getWorkspaceId()))
                        .cache();
            });
        } else {
            sourcePackageMono = Mono.just(convertToModuleRequestDTO.getPackageId())
                    .flatMap(packageId -> packagePermissionChecker
                            .findById(packageId, packagePermission.getEditPermission())
                            .switchIfEmpty(Mono.error(new AppsmithException(
                                    AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE_ID, packageId))))
                    .flatMap(aPackage -> crudPackageService.generatePackageByViewMode(aPackage, ResourceModes.EDIT))
                    .cache();
        }

        final ModuleConvertibleMetaDTO moduleConvertibleMetaDTO = prepareModuleConvertibleMetaDTO(
                convertToModuleRequestDTO.getPublicEntityId(),
                convertToModuleRequestDTO.getModuleType(),
                sourcePackageMono,
                publicEntityCandidateMono,
                branchName);

        Mono<CreateExistingEntityToModuleResponseDTO> createExistingEntityToModuleResponseDTOMono =
                getCreateExistingEntityToModuleResponseDTOMono(moduleConvertibleMetaDTO);

        return publicEntityCandidateMono.flatMap(publicEntity -> {
            return queryModuleConvertibleService
                    .convertToModule(moduleConvertibleMetaDTO)
                    .then(Mono.defer(() -> createExistingEntityToModuleResponseDTOMono));
        });
    }

    private Mono<List<String>> getExistingPackageNames(String workspaceId) {
        return packagePermissionChecker
                .findAllByWorkspaceId(workspaceId, packagePermission.getReadPermission())
                .mapNotNull(aPackage -> aPackage.getUnpublishedPackage().getName())
                .collectList();
    }

    private ModuleConvertibleMetaDTO prepareModuleConvertibleMetaDTO(
            String publicEntityId,
            ModuleType moduleType,
            Mono<PackageDTO> sourcePackageMono,
            Mono<Reusable> publicEntityMono,
            String branchName) {
        ModuleConvertibleMetaDTO moduleConvertibleMetaDTO = new ModuleConvertibleMetaDTO();
        moduleConvertibleMetaDTO.setPublicEntityId(publicEntityId);
        moduleConvertibleMetaDTO.setModuleType(moduleType);
        moduleConvertibleMetaDTO.setBranchName(branchName);
        moduleConvertibleMetaDTO.setSourcePackageMono(sourcePackageMono);
        moduleConvertibleMetaDTO.setPublicEntityMono(publicEntityMono);
        return moduleConvertibleMetaDTO;
    }

    private static Mono<CreateExistingEntityToModuleResponseDTO> getCreateExistingEntityToModuleResponseDTOMono(
            ModuleConvertibleMetaDTO moduleConvertibleMetaDTO) {
        Mono<CreateExistingEntityToModuleResponseDTO> createExistingEntityToModuleResponseDTOMono = Mono.just(
                        moduleConvertibleMetaDTO)
                .flatMap(filledModuleConvertibleMetaDTO -> {
                    CreateExistingEntityToModuleResponseDTO createExistingEntityToModuleResponseDTO =
                            new CreateExistingEntityToModuleResponseDTO();
                    createExistingEntityToModuleResponseDTO.setModule(filledModuleConvertibleMetaDTO.getModuleDTO());
                    createExistingEntityToModuleResponseDTO.setPackageData(
                            filledModuleConvertibleMetaDTO.getPackageDTO());
                    createExistingEntityToModuleResponseDTO.setModuleInstanceData(
                            moduleConvertibleMetaDTO.getModuleInstanceData());
                    createExistingEntityToModuleResponseDTO.setOriginPackageId(
                            moduleConvertibleMetaDTO.getOriginPackageId());
                    createExistingEntityToModuleResponseDTO.setOriginModuleId(
                            moduleConvertibleMetaDTO.getOriginModuleId());
                    return Mono.just(createExistingEntityToModuleResponseDTO);
                });
        return createExistingEntityToModuleResponseDTOMono;
    }

    private int findHighestPackageNumber(List<String> takenNames) {
        AtomicInteger highestNumber = new AtomicInteger(0);

        takenNames.parallelStream().anyMatch(name -> {
            Matcher matcher = PACKAGE_NAME_PATTERN.matcher(name);
            if (matcher.matches()) {
                int currentNumber = Integer.parseInt(matcher.group(1));
                highestNumber.updateAndGet(val -> Math.max(val, currentNumber));
            }
            return false;
        });

        return highestNumber.get();
    }
}
