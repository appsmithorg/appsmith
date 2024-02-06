package com.appsmith.server.helpers.bridge;

import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class Update {
    private final List<SetOp> setOps = new ArrayList<>();

    public Update set(String key, Object value) {
        setOps.add(new SetOp(key, value));
        return this;
    }

    public record SetOp(String key, Object value) {}
}
