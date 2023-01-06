package com.appsmith.server.exceptions;

public class UnsupportedMongoDBVersionException extends RuntimeException {
    public UnsupportedMongoDBVersionException(String message) {
        super(message);
    }
}
