package com.appsmith.external.constants;

public enum ConnectionMethod {
    CONNECTION_METHOD_STANDARD {
        @Override
        public String toString() {
            return "STANDARD";
        }
    },
    CONNECTION_METHOD_SSH {
        @Override
        public String toString() {
            return "SSH";
        }
    }
}
