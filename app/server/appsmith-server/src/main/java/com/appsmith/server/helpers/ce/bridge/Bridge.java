package com.appsmith.server.helpers.ce.bridge;

public class Bridge {
    private Bridge() {}

    public static Conditioner equal(String key, String value) {
        return new Conditioner().equal(key, value);
    }
}
