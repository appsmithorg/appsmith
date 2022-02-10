package com.appsmith.external.helpers;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.time.StopWatch;

import java.util.concurrent.TimeUnit;

@Slf4j
public class Stopwatch {

    private final String processName;
    private final StopWatch watch = new StopWatch();

    public Stopwatch(String processName) {
        this.processName = processName;
        this.watch.start();
    }

    public void stopAndLogTimeInMillis() {
        this.watch.stop();
        log.debug("Process: {}, Time elapsed: {}ms", this.processName, this.watch.getTime(TimeUnit.MILLISECONDS));
    }
}
