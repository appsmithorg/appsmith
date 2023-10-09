package com.appsmith.external.models;

public enum ModuleInstanceCreatorType {
    PAGE, // When module is instantiated on a page, the creator type would be `PAGE` for such instance
    MODULE // When one module can use another module, the creator type for such module instance would be `MODULE`
}
