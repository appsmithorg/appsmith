package com.appsmith.server.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.git.helpers.FileUtilsImpl;
import com.appsmith.server.applications.git.ApplicationGitFileUtils;
import com.appsmith.server.helpers.ce.CommonGitFileUtilsCE;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Import({FileUtilsImpl.class})
public class CommonGitFileUtils extends CommonGitFileUtilsCE {

    public CommonGitFileUtils(
            ApplicationGitFileUtils applicationGitFileUtils,
            FileInterface fileUtils,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            Gson gson) {
        super(applicationGitFileUtils, fileUtils, analyticsService, sessionUserService, gson);
    }
}
