package com.appsmith.server.services;

import com.appsmith.server.services.ce_compatible.CommonGitServiceCECompatibleImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CommonGitServiceImpl extends CommonGitServiceCECompatibleImpl implements CommonGitService {
}
