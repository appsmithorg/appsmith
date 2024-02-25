package com.appsmith.fclass;

public class Fielder {
    protected final String $path;

    public Fielder(String path) {
        this.$path = path;
    }

    public String getName() {
        return $path.substring(1 + $path.lastIndexOf('.'));
    }

    public String getPath() {
        return $path;
    }

    @Override
    public String toString() {
        return "Fielder[" + $path + "]";
    }
}
