package com.appsmith.server.moduleinstances.exportable;

import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCECompatible;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class ModuleInstanceExportableServiceCECompatibleImpl implements ExportableServiceCECompatible<ModuleInstance> {

    @Override
    public ArtifactBasedExportableService<ModuleInstance, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        return null;
    }
}
