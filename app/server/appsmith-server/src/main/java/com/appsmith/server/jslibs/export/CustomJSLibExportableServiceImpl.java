package com.appsmith.server.jslibs.export;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.export.exportable.ExportableService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import org.springframework.stereotype.Service;

@Service
public class CustomJSLibExportableServiceImpl extends CustomJSLibExportableServiceCEImpl
        implements ExportableService<CustomJSLib> {
    public CustomJSLibExportableServiceImpl(CustomJSLibService customJSLibService) {
        super(customJSLibService);
    }
}
