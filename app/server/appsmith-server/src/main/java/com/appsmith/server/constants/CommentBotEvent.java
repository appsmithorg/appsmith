package com.appsmith.server.constants;

public enum CommentBotEvent {
    COMMENTED(1), TAGGED(2);

    private final int order;

    CommentBotEvent(int order) {
        this.order = order;
    }

    public int getOrder() {
        return order;
    }
}
