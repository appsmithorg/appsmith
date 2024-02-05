package com.appsmith.server.helpers;

import org.hibernate.dialect.PostgresPlusDialect;
import org.hibernate.query.spi.QueryEngine;

public class Dialect extends PostgresPlusDialect {

    public Dialect() {
        super();
    }

    @Override
    public void initializeFunctionRegistry(QueryEngine queryEngine) {
        super.initializeFunctionRegistry(queryEngine);
        // queryEngine.getSqmFunctionRegistry().register("minus", new MinusFunction());
    }
}
