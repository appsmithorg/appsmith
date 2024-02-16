package com.appsmith.server.jslibs.importable;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import org.springframework.stereotype.Service;

@Service
public class CustomJSLibImportableServiceImpl extends CustomJSLibImportableServiceCEImpl
        implements ImportableService<CustomJSLib> {
    public CustomJSLibImportableServiceImpl(CustomJSLibService customJSLibService) {
        super(customJSLibService);
    }
}
