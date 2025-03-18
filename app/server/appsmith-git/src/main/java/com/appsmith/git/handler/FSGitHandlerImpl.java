package com.appsmith.git.handler;

import com.appsmith.external.configurations.git.GitConfig;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.handler.ce.FSGitHandlerCEImpl;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Slf4j
@Primary
@Component
public class FSGitHandlerImpl extends FSGitHandlerCEImpl implements FSGitHandler {

    public FSGitHandlerImpl(
            GitServiceConfig gitServiceConfig,
            GitConfig gitConfig,
            ObservationRegistry observationRegistry,
            ObservationHelper observationHelper) {
        super(gitServiceConfig, gitConfig, observationRegistry, observationHelper);
    }
}
