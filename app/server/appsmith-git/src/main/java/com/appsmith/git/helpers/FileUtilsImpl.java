package com.appsmith.git.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.helpers.ce.FileUtilsCEImpl;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Slf4j
@Getter
@Component
@Import({GitServiceConfig.class})
public class FileUtilsImpl extends FileUtilsCEImpl implements FileInterface {

    public FileUtilsImpl(GitServiceConfig gitServiceConfig, GitExecutor gitExecutor) {
        super(gitServiceConfig, gitExecutor);
    }
}
