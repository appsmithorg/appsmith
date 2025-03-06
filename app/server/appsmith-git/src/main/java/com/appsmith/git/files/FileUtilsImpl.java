package com.appsmith.git.files;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.git.configurations.GitServiceConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Slf4j
@Getter
@Component
@Primary
@Import({GitServiceConfig.class})
public class FileUtilsImpl extends FileUtilsCEImpl implements FileInterface {

    public FileUtilsImpl(
            GitServiceConfig gitServiceConfig,
            FSGitHandler fsGitHandler,
            GitExecutor gitExecutor,
            FileOperations fileOperations,
            ObservationHelper observationHelper,
            ObjectMapper objectMapper) {
        super(gitServiceConfig, fsGitHandler, gitExecutor, fileOperations, observationHelper, objectMapper);
    }
}
