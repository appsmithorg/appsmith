package com.appsmith.external.helpers;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.time.StopWatch;

import java.util.concurrent.TimeUnit;

@Slf4j
@Getter
public class Stopwatch {

    private final String flow;
    private final StopWatch watch = new StopWatch();

    public Stopwatch(String flow) {
        this.flow = flow;
        this.watch.start();
    }

    public void stopAndLogTimeInMillis() {
        if (!this.watch.isStopped()) {
            this.watch.stop();
        }
        log.debug("Execute time: {}, Time elapsed: {}ms", this.flow, this.watch.getTime(TimeUnit.MILLISECONDS));
    }

    /**
     * This is a temporary function created to log stopwatch timer within the plugin package
     * Due to this bug https://github.com/appsmithorg/appsmith/issues/36073 logging is not working in the plugin package
     */
    public void stopAndLogTimeInMillisWithSysOut() {
        if (!this.watch.isStopped()) {
            this.watch.stop();
        }
        System.out.println(String.format(
                "Execute time: %s, Time elapsed: %dms", this.flow, this.watch.getTime(TimeUnit.MILLISECONDS)));
    }

    public void stopTimer() {
        if (!this.watch.isStopped()) {
            this.watch.stop();
        }
    }

    public long getExecutionTime() {
        return this.watch.getTime(TimeUnit.MILLISECONDS);
    }
}
