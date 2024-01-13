package com.appsmith.server.newpages.exports;

import com.appsmith.server.domains.NewPage;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.solutions.PagePermission;
import org.springframework.stereotype.Service;

@Service
public class NewPageExportableServiceImpl extends NewPageExportableServiceCEImpl implements ExportableService<NewPage> {

    public NewPageExportableServiceImpl(NewPageService newPageService, PagePermission pagePermission) {
        super(newPageService, pagePermission);
    }
}
