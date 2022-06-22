package com.appsmith.external.services;

import com.appsmith.external.services.ce.DatatypeServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DatatypeServiceImpl extends DatatypeServiceCEImpl implements DatatypeService {

    private static DatatypeServiceImpl instance = null;

    private DatatypeServiceImpl() {
        super();
    }

    public static DatatypeServiceImpl getInstance() {

        if (instance == null) {
            instance = new DatatypeServiceImpl();
        }

        return instance;
    }

}

