package com.appsmith.server.helpers.ce;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;

@Component
@RequiredArgsConstructor
public class ExecutionTimeLogging {
    private Long startTime = System.currentTimeMillis();
    private HashMap<String, Long> taskStartTime = new HashMap<>();
    private HashMap<String, Long> taskEndTime = new HashMap<>();

    public void startTimer(String taskName) {
        taskStartTime.put(taskName, System.currentTimeMillis() - startTime);
    }

    public void stopTimer(String taskName) {
        taskEndTime.put(taskName, System.currentTimeMillis() - startTime);
    }

    public String print() {
        StringBuilder sb = new StringBuilder();
        sb.append("\nTime consumed for the operation ")
                .append(System.currentTimeMillis() - startTime)
                .append("\n");
        for (String taskName : taskStartTime.keySet()) {
            sb.append(taskName)
                    .append(";")
                    .append(taskStartTime.get(taskName))
                    .append(";")
                    .append(taskEndTime.getOrDefault(taskName, 0L))
                    .append(";")
                    .append(taskEndTime.getOrDefault(taskName, 0L) - taskStartTime.get(taskName))
                    .append("\n");
        }
        return sb.toString();
    }

    public <T> Mono<T> measureTask(String name, Mono<T> mono) {
        // stopWatch.start(name);
        return mono.map(time -> {
                    stopTimer(name);
                    return time;
                })
                .doOnSubscribe((s) -> startTimer(name));
    }
}
