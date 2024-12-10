package com.appsmith.server.helpers;

import org.hibernate.boot.model.FunctionContributions;
import org.hibernate.dialect.PostgresPlusDialect;

public class Dialect extends PostgresPlusDialect {

    public Dialect() {
        super();
    }

    @Override
    public void initializeFunctionRegistry(FunctionContributions functionContributions) {
        super.initializeFunctionRegistry(functionContributions);
        // queryEngine.getSqmFunctionRegistry().register("minus", new MinusFunction());
    }
}
