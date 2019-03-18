package com.mobtools.server.services;

import com.mobtools.server.domains.Widget;
import com.mobtools.server.repositories.WidgetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
@Slf4j
public class WidgetServiceImpl extends BaseService implements WidgetService {

    private WidgetRepository widgetRepository;

    @Autowired
    public WidgetServiceImpl(Scheduler scheduler, WidgetRepository widgetRepository) {
        super(scheduler);
        this.widgetRepository = widgetRepository;
    }

    @Override
    public Mono<Widget> getByName(String name) {
        return Mono.fromCallable(() -> widgetRepository.findByName(name))
                .subscribeOn(scheduler);
    }

    @Override
    public Flux<Widget> get() {
        return Mono.fromCallable(() -> widgetRepository.findAll())
                .flatMapMany(Flux::fromIterable)
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<Widget> create(Widget widget) {
        return Mono.fromCallable(
                () -> widgetRepository.save(widget)
        ).subscribeOn(this.scheduler);
    }

    @Override
    public Mono<Widget> update(Widget widget) throws Exception {
        if(widget.getId() == null) {
            throw new Exception("Invalid id provided");
        }

        return Mono.fromCallable(
                () -> widgetRepository.save(widget)
        ).subscribeOn(this.scheduler);
    }
}
