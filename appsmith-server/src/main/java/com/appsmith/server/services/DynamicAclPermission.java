package com.appsmith.server.services;

import java.lang.annotation.Annotation;

public class DynamicAclPermission implements AclPermission {
    String[] values;
    String principal;

    public DynamicAclPermission(String principal) {
//        this.values = values;
        this.principal = principal;
    }

    @Override
    public String[] values() {
        return this.values;
    }

    @Override
    public String principal() {
        return this.principal;
    }

    @Override
    public Class<? extends Annotation> annotationType() {
        return DynamicAclPermission.class;
    }
}
