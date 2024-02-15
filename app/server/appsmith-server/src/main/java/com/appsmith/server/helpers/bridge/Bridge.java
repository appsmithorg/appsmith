package com.appsmith.server.helpers.bridge;

import com.appsmith.external.models.BaseDomain;

import java.util.Collection;

public class Bridge<T extends BaseDomain> {

    private Bridge() {}

    public static Update update() {
        return new Update();
    }

    public static Conditioner<? extends BaseDomain> equal(String key, String value) {
        return new Conditioner<>().equal(key, value);
    }

    public static Conditioner<? extends BaseDomain> eqIgnoreCase(String key, String value) {
        return new Conditioner<>().eqIgnoreCase(key, value);
    }

    public static Conditioner<? extends BaseDomain> in(String key, Collection<String> value) {
        return new Conditioner<>().in(key, value);
    }

    public static Conditioner<? extends BaseDomain> isTrue(String key) {
        return new Conditioner<>().isTrue(key);
    }

    public static Conditioner<? extends BaseDomain> jsonIn(String needle, String key) {
        return new Conditioner<>().jsonIn(needle, key);
    }
}
