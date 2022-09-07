package com.appsmith.external.services;

import com.appsmith.external.services.ce.DataTypeServiceCEImpl;

public class DataTypeServiceImpl extends DataTypeServiceCEImpl implements DataTypeService {
    private static DataTypeServiceImpl instance;

    private DataTypeServiceImpl() {
        super();
    }

    public static synchronized DataTypeServiceImpl getInstance() {
        if (instance == null) {
            instance = new DataTypeServiceImpl();
        }
        return instance;
    }
}