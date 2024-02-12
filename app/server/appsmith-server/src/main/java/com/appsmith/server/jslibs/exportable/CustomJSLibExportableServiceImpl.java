package com.appsmith.server.jslibs.exportable;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import org.springframework.stereotype.Service;

import static com.appsmith.server.constants.FieldName.PACKAGE;
import static com.appsmith.server.constants.ce.FieldNameCE.APPLICATION;

@Service
public class CustomJSLibExportableServiceImpl extends CustomJSLibExportableServiceCEImpl
        implements ExportableService<CustomJSLib> {
    protected final ArtifactBasedExportableService<CustomJSLib, Package> packageExportableService;

    public CustomJSLibExportableServiceImpl(
            ArtifactBasedExportableService<CustomJSLib, Application> applicationExportableService,
            ArtifactBasedExportableService<CustomJSLib, Package> packageExportableService) {
        super(applicationExportableService);
        this.packageExportableService = packageExportableService;
    }

    @Override
    public ArtifactBasedExportableService<CustomJSLib, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        return switch (exportingMetaDTO.getArtifactType()) {
            case APPLICATION -> super.getArtifactBasedExportableService(exportingMetaDTO);
            case PACKAGE -> packageExportableService;
            default -> null;
        };
    }
}
