package com.appsmith.server.git.autocommit;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.git.autocommit.helpers.AutoCommitEligibilityHelper;
import com.appsmith.server.git.autocommit.helpers.GitAutoCommitHelperImpl;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import org.springframework.stereotype.Component;

@Component
public class AutoCommitServiceImpl extends AutoCommitServiceCEImpl implements AutoCommitService {

    public AutoCommitServiceImpl(
            ApplicationService applicationService,
            ApplicationPermission applicationPermission,
            NewPageService newPageService,
            PagePermission pagePermission,
            AutoCommitEligibilityHelper autoCommitEligibilityHelper,
            GitAutoCommitHelperImpl gitAutoCommitHelper) {
        super(
                applicationService,
                applicationPermission,
                newPageService,
                pagePermission,
                autoCommitEligibilityHelper,
                gitAutoCommitHelper);
    }
}
