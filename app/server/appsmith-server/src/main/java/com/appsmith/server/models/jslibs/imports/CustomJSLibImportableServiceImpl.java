package com.appsmith.server.models.jslibs.imports;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.models.jslibs.base.CustomJSLibService;
import org.springframework.stereotype.Service;

@Service
public class CustomJSLibImportableServiceImpl extends CustomJSLibImportableServiceCEImpl
        implements ImportableService<CustomJSLib> {
    public CustomJSLibImportableServiceImpl(CustomJSLibService customJSLibService) {
        super(customJSLibService);
    }
}
