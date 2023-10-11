package com.appsmith.server.solutions;

import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.helpers.ReleaseNotesUtils;
import com.appsmith.server.solutions.ce.ReleaseNotesServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ReleaseNotesServiceImpl extends ReleaseNotesServiceCEImpl implements ReleaseNotesService {

    public ReleaseNotesServiceImpl(ProjectProperties projectProperties, ReleaseNotesUtils releaseNotesUtils) {
        super(projectProperties, releaseNotesUtils);
    }
}
