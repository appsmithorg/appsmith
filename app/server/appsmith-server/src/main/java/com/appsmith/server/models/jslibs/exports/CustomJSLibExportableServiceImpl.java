package com.appsmith.server.models.jslibs.exports;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.models.jslibs.base.CustomJSLibService;
import org.springframework.stereotype.Service;

@Service
public class CustomJSLibExportableServiceImpl extends CustomJSLibExportableServiceCEImpl
        implements ExportableService<CustomJSLib> {
    public CustomJSLibExportableServiceImpl(CustomJSLibService customJSLibService) {
        super(customJSLibService);
    }
}
