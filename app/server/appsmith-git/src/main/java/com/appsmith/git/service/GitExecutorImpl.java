package com.appsmith.git.service;

import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.constants.CommonConstants;
import com.appsmith.git.constants.GitDirectories;
import com.appsmith.git.service.ce.GitExecutorCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Status;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

import static com.appsmith.git.constants.CommonConstants.JSON_EXTENSION;

@Component
@Slf4j
public class GitExecutorImpl extends GitExecutorCEImpl implements GitExecutor {

    public GitExecutorImpl(GitServiceConfig gitServiceConfig) {
        super(gitServiceConfig);
    }

    @Override
    protected void populateModifiedEntities(Status status, GitStatusDTO response, Set<String> modifiedAssets) {
        Set<String> moduleInstancesModified = new HashSet<>();

        int modifiedModuleInstances = 0;
        int modifiedModules = 0;

        super.populateModifiedEntities(status, response, modifiedAssets);

        for (String x : modifiedAssets) {
            if (x.contains(GitDirectories.MODULE_INSTANCES_DIRECTORY + CommonConstants.DELIMITER_PATH)) {
                String moduleInstanceName =
                        x.split(GitDirectories.MODULE_INSTANCES_DIRECTORY + CommonConstants.DELIMITER_PATH)[1];
                int position = moduleInstanceName.indexOf(JSON_EXTENSION);
                if (position != -1) {
                    moduleInstanceName = moduleInstanceName.substring(0, position);
                    String pageName = x.split(CommonConstants.DELIMITER_PATH)[1];
                    if (!moduleInstancesModified.contains(pageName + moduleInstanceName)) {
                        moduleInstancesModified.add(pageName + moduleInstanceName);
                        modifiedModuleInstances++;
                    }
                }
            } else if (x.contains(GitDirectories.SOURCE_MODULES_DIRECTORY + CommonConstants.DELIMITER_PATH)) {
                modifiedModules++;
            }
        }
        response.setModifiedModuleInstances(modifiedModuleInstances);
        response.setModifiedModules(modifiedModules);
    }

    @Override
    protected boolean isAModifiedPage(String x) {
        return super.isAModifiedPage(x)
                && !x.contains(GitDirectories.SOURCE_MODULES_DIRECTORY)
                && !x.contains(GitDirectories.MODULE_INSTANCES_DIRECTORY);
    }
}
