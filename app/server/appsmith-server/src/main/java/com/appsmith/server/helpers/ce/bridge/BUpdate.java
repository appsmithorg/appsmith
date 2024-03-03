package com.appsmith.server.helpers.ce.bridge;

import com.querydsl.core.types.Path;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class BUpdate {
    private final List<SetOp> setOps = new ArrayList<>();

    public BUpdate set(Path<?> key, Object value) {
        setOps.add(new SetOp(key, value));
        return this;
    }

    public BUpdate set(String key, Object value) {
        setOps.add(new SetOp(key, value));
        return this;
    }

    public record SetOp(Object key, Object value) {}
}
