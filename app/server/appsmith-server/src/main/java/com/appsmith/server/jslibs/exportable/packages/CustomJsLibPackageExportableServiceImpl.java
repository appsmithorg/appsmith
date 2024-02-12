package com.appsmith.server.jslibs.exportable.packages;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.packages.exportable.utils.PackageExportableUtilsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

@RequiredArgsConstructor
@Service
public class CustomJsLibPackageExportableServiceImpl extends PackageExportableUtilsImpl
        implements ArtifactBasedExportableService<CustomJSLib, Package> {

    @Override
    public Flux<CustomJSLib> findByContextIdsForExport(List<String> contextIds, AclPermission permission) {
        return Flux.empty();
    }

    @Override
    public void mapExportableReferences(
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            CustomJSLib moduleInstance,
            ResourceModes resourceMode) {}

    @Override
    public String getContextNameAtIdReference(Object dtoObject) {
        return null;
    }
}
