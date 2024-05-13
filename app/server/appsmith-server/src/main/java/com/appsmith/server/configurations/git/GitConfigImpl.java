package com.appsmith.server.configurations.git;

import com.appsmith.external.configurations.git.GitConfig;
import org.springframework.stereotype.Component;

@Component
public class GitConfigImpl extends GitConfigCECompatibleImpl implements GitConfig {}
