package com.appsmith.server.solutions;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.solutions.ce.PolicySolutionCEImpl;
import org.springframework.stereotype.Service;

@Service
public class PolicySolutionImpl extends PolicySolutionCEImpl implements PolicySolution {
    public PolicySolutionImpl(
            PolicyGenerator policyGenerator,
            ApplicationRepository applicationRepository,
            DatasourceRepository datasourceRepository,
            NewPageRepository newPageRepository,
            NewActionRepository newActionRepository,
            ActionCollectionRepository actionCollectionRepository,
            ThemeRepository themeRepository,
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
