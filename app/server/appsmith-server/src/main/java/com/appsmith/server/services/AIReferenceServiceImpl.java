package com.appsmith.server.services;

import com.appsmith.server.services.ce.AIReferenceServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AIReferenceServiceImpl extends AIReferenceServiceCEImpl implements AIReferenceService {

    public AIReferenceServiceImpl() {
        super();
    }
}
