package com.appsmith.server.solutions;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.repositories.ActionCollectionRepositoryCake;
import com.appsmith.server.repositories.ApplicationRepositoryCake;
import com.appsmith.server.repositories.DatasourceRepositoryCake;
import com.appsmith.server.repositories.NewActionRepositoryCake;
import com.appsmith.server.repositories.NewPageRepositoryCake;
import com.appsmith.server.repositories.ThemeRepositoryCake;
import com.appsmith.server.solutions.ce.PolicySolutionCEImpl;
import org.springframework.stereotype.Service;

@Service
public class PolicySolutionImpl extends PolicySolutionCEImpl implements PolicySolution {
    public PolicySolutionImpl(
            PolicyGenerator policyGenerator,
            ApplicationRepositoryCake applicationRepository,
            DatasourceRepositoryCake datasourceRepository,
            NewPageRepositoryCake newPageRepository,
            NewActionRepositoryCake newActionRepository,
            ActionCollectionRepositoryCake actionCollectionRepository,
            ThemeRepositoryCake themeRepository,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission) {
        super(
                policyGenerator,
                applicationRepository,
                datasourceRepository,
                newPageRepository,
                newActionRepository,
                actionCollectionRepository,
                themeRepository,
                datasourcePermission,
                applicationPermission,
                pagePermission);
    }
}
