package com.appsmith.server.jslibs.exports;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class CustomJSLibExportableServiceImpl extends CustomJSLibExportableServiceCEImpl
        implements ExportableService<CustomJSLib> {

    private final CustomJSLibService customJSLibService;

    public CustomJSLibExportableServiceImpl(CustomJSLibService customJSLibService) {
        super(customJSLibService);
        this.customJSLibService = customJSLibService;
    }

    @Override
    protected Mono<List<CustomJSLib>> getAllJSLibsInContext(ExportingMetaDTO exportingMetaDTO) {
        return customJSLibService.getAllVisibleJSLibsInContext(
                exportingMetaDTO.getApplicationId(),
                CreatorContextType.APPLICATION,
                exportingMetaDTO.getBranchName(),
                false);
    }
}
