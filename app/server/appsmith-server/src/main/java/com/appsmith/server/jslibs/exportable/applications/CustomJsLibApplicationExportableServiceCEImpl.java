package com.appsmith.server.jslibs.exportable.applications;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.exportable.utils.ApplicationExportableUtilsImpl;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableServiceCE;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

@RequiredArgsConstructor
@Service
public class CustomJsLibApplicationExportableServiceCEImpl extends ApplicationExportableUtilsImpl
        implements ArtifactBasedExportableServiceCE<CustomJSLib, Application> {

    private final CustomJSLibService customJSLibService;

    @Override
    public Flux<CustomJSLib> findByContextIdsForExport(List<String> contextIds, AclPermission permission) {
        return customJSLibService.getAllVisibleJSLibsInContext(
                contextIds.get(0), CreatorContextType.APPLICATION, null, false);
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
