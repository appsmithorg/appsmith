package com.appsmith.git.service;

import com.appsmith.external.configurations.git.GitConfig;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.service.ce.GitExecutorCEImpl;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
@Slf4j
public class GitExecutorImpl extends GitExecutorCEImpl implements GitExecutor {
    public GitExecutorImpl(
            GitServiceConfig gitServiceConfig,
            GitConfig gitConfig,
            ObservationRegistry observationRegistry,
            ObservationHelper observationHelper) {
        super(gitServiceConfig, gitConfig, observationRegistry, observationHelper);
    }
}
