package com.appsmith.git.service;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.service.ce.GitExecutorCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class GitExecutorImpl extends GitExecutorCEImpl implements GitExecutor {

    public GitExecutorImpl(GitServiceConfig gitServiceConfig) {
        super(gitServiceConfig);
    }
}
