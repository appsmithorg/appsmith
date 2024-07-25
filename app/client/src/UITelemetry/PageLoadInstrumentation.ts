import type { Span } from "@opentelemetry/api";
import { InstrumentationBase } from "@opentelemetry/instrumentation";
import { startRootSpan, startNestedSpan } from "./generateTraces";

type LargestContentfulPaint = PerformanceEntry & {
  renderTime: number;
  url: string;
};

export class PageLoadInstrumentation extends InstrumentationBase {
  paintTimingObserver: PerformanceObserver | null = null;
  navigationTimingObserver: PerformanceObserver | null = null;
  resourceTimingObserver: PerformanceObserver | null = null;
  rootSpan: Span;
  ignoreResourceUrls: string[] = [];

  constructor({ ignoreResourceUrls = [] }: { ignoreResourceUrls?: string[] }) {
    super("appsmith-page-load-instrumentation", "1.0.0", {
      enabled: true,
    });
    this.ignoreResourceUrls = ignoreResourceUrls;
    this.rootSpan = startRootSpan("PAGE_LOAD", {}, 0);
  }

  init() {}

  enable(): void {
    if (PerformanceObserver) {
      this._observePaintTimings();
      this._observeLCPTiming();
      this._observeNavigationTimings();
      this._observeResourceTimings();
    } else {
      this._registerPerformanceObserverFallback();
    }
  }

  private _kebabToScreamingSnakeCase(str: string) {
    return str.replace(/-/g, "_").toUpperCase();
  }

  private _pushPaintTimingToSpan(entries: PerformanceEntry[]) {
    entries.forEach((entry) => {
      const paintSpan = startNestedSpan(
        this._kebabToScreamingSnakeCase(entry.name),
        this.rootSpan,
        {},
        0,
      );

      paintSpan.end(entry.startTime);
    });
  }

  private _observePaintTimings() {
    this.paintTimingObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEntry[];
      this._pushPaintTimingToSpan(entries);
    });

    this.paintTimingObserver.observe({
      type: "paint",
      buffered: true,
    });
  }

  private _pushLcpTimingToSpan(entries: LargestContentfulPaint[]) {
    const pageLcpEntries = entries.filter((entry) => entry.url === "");

    const lastEntry = pageLcpEntries[entries.length - 1];

    if (!lastEntry) {
      return;
    }

    const lcpSpan = startNestedSpan(
      "LARGEST_CONTENTFUL_PAINT",
      this.rootSpan,
      {},
      0,
    );

    lcpSpan.end(lastEntry.renderTime);
  }

  private _observeLCPTiming() {
    this.paintTimingObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as LargestContentfulPaint[];
      this._pushLcpTimingToSpan(entries);
      this.paintTimingObserver?.disconnect();
    });

    this.paintTimingObserver.observe({
      type: "largest-contentful-paint",
      buffered: true,
    });
  }

  private _observeNavigationTimings() {
    this.navigationTimingObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceNavigationTiming[];
      this._pushNavigationTimingToSpan(entries);
    });

    this.navigationTimingObserver.observe({
      type: "navigation",
      buffered: true,
    });
  }

  private _pushNavigationTimingToSpan(entries: PerformanceNavigationTiming[]) {
    const navigationEntry = entries[0];

    const {
      connectEnd,
      connectStart,
      decodedBodySize,
      domainLookupEnd,
      domainLookupStart,
      domComplete,
      domContentLoadedEventEnd,
      domContentLoadedEventStart,
      domInteractive,
      encodedBodySize,
      entryType,
      fetchStart,
      initiatorType,
      loadEventEnd,
      loadEventStart,
      name: url,
      nextHopProtocol,
      redirectCount,
      redirectEnd,
      redirectStart,
      requestStart,
      responseEnd,
      responseStart,
      secureConnectionStart,
      startTime: navigationStartTime,
      transferSize,
      type: navigationType,
      unloadEventEnd,
      unloadEventStart,
      workerStart,
    } = navigationEntry;

    this.rootSpan.setAttributes({
      connectEnd,
      connectStart,
      decodedBodySize,
      domComplete,
      domContentLoadedEventEnd,
      domContentLoadedEventStart,
      domInteractive,
      domainLookupEnd,
      domainLookupStart,
      encodedBodySize,
      entryType,
      fetchStart,
      initiatorType,
      loadEventEnd,
      loadEventStart,
      nextHopProtocol,
      redirectCount,
      redirectEnd,
      redirectStart,
      requestStart,
      responseEnd,
      responseStart,
      secureConnectionStart,
      navigationStartTime,
      transferSize,
      navigationType,
      url,
      unloadEventEnd,
      unloadEventStart,
      workerStart,
    });

    this.rootSpan?.end(navigationEntry.domContentLoadedEventEnd);
  }

  private _observeResourceTimings() {
    this.resourceTimingObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      this._pushResourceTimingToSpan(entries);
    });

    this.resourceTimingObserver.observe({
      type: "resource",
      buffered: true,
    });
  }

  private _pushResourceTimingToSpan(entries: PerformanceResourceTiming[]) {
    entries
      .filter(({ name }) => {
        return !this.ignoreResourceUrls.some((ignoreUrl) =>
          name.includes(ignoreUrl),
        );
      })
      .forEach((entry) => {
        const {
          connectEnd,
          connectStart,
          decodedBodySize,
          domainLookupEnd,
          domainLookupStart,
          duration: resourceDuration,
          encodedBodySize,
          entryType,
          fetchStart,
          initiatorType,
          name: url,
          nextHopProtocol,
          redirectEnd,
          redirectStart,
          requestStart,
          responseEnd,
          responseStart,
          secureConnectionStart,
          transferSize,
          workerStart,
        } = entry;

        const resourceSpan = startNestedSpan(
          entry.name,
          this.rootSpan,
          {
            connectEnd,
            connectStart,
            decodedBodySize,
            domainLookupEnd,
            domainLookupStart,
            encodedBodySize,
            entryType,
            fetchStart,
            firstInterimResponseStart: (entry as any).firstInterimResponseStart,
            initiatorType,
            nextHopProtocol,
            redirectEnd,
            redirectStart,
            requestStart,
            responseEnd,
            responseStart,
            resourceDuration,
            secureConnectionStart,
            transferSize,
            url,
            workerStart,
            renderBlockingStatus: (entry as any).renderBlockingStatus,
          },
          entry.startTime,
        );

        resourceSpan.end(entry.responseEnd);
      });
  }

  private _registerPerformanceObserverFallback() {
    window.removeEventListener("load", this._onDocumentLoaded);

    if (window.document.readyState === "complete") {
      this._collectPerformanceEntries();
    } else {
      window.addEventListener("load", this._onDocumentLoaded);
    }
  }

  private _onDocumentLoaded() {
    setTimeout(() => {
      this._collectPerformanceEntries();
    });
  }

  private _collectPerformanceEntries() {}

  disable(): void {
    if (this.paintTimingObserver) {
      this.paintTimingObserver.disconnect();
    }

    if (this.navigationTimingObserver) {
      this.navigationTimingObserver.disconnect();
    }

    if (this.resourceTimingObserver) {
      this.resourceTimingObserver.disconnect();
    }

    if (this.rootSpan) {
      this.rootSpan.end();
    }
  }
}
