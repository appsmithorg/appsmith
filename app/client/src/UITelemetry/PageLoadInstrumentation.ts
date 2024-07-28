import type { Span } from "@opentelemetry/api";
import { InstrumentationBase } from "@opentelemetry/instrumentation";
import { startRootSpan, startNestedSpan } from "./generateTraces";
import { onLCP, onFCP } from "web-vitals/attribution";
import type {
  LCPMetricWithAttribution,
  FCPMetricWithAttribution,
  NavigationTimingPolyfillEntry,
} from "web-vitals";

export class PageLoadInstrumentation extends InstrumentationBase {
  resourceTimingObserver: PerformanceObserver | null = null;
  rootSpan: Span;
  ignoreResourceUrls: string[] = [];
  pageLastHiddenAt: number = 0;
  pageHiddenFor: number = 0;
  wasNavigationEntryPushed: boolean = false;
  resourceEntriesSet: Set<string> = new Set();
  resourceEntryPollTimeout: number | null = null;

  constructor({ ignoreResourceUrls = [] }: { ignoreResourceUrls?: string[] }) {
    super("appsmith-page-load-instrumentation", "1.0.0", {
      enabled: true,
    });
    this.ignoreResourceUrls = ignoreResourceUrls;
    this.rootSpan = startRootSpan("PAGE_LOAD", {}, 0);
  }

  init() {}

  enable(): void {
    this.addVisibilityChangeListener();

    onLCP(this.onLCPReport.bind(this), { reportAllChanges: true });
    onFCP(this.onFCPReport.bind(this), { reportAllChanges: true });

    if (PerformanceObserver) {
      this.observeResourceTimings();
    } else {
      this.pollResourceTimingEntries();
    }
  }

  private addVisibilityChangeListener() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.pageLastHiddenAt = performance.now();
      } else {
        const endTime = performance.now();
        this.pageHiddenFor = endTime - this.pageLastHiddenAt;
      }
    });
  }

  private onLCPReport(metric: LCPMetricWithAttribution) {
    const {
      attribution: { lcpEntry },
    } = metric;

    if (lcpEntry) {
      this.pushLcpTimingToSpan(lcpEntry);
    }
  }

  private onFCPReport(metric: FCPMetricWithAttribution) {
    const {
      attribution: { fcpEntry, navigationEntry },
    } = metric;

    if (navigationEntry && !this.wasNavigationEntryPushed) {
      this.pushNavigationTimingToSpan(navigationEntry);
      this.wasNavigationEntryPushed = true;
    }

    if (fcpEntry) {
      this.pushPaintTimingToSpan(fcpEntry);
    }
  }

  private getElementName(element?: Element | null, depth = 0): string {
    if (!element || depth > 3) {
      return "";
    }

    const elementTestId = element.getAttribute("data-testid");
    const className = element.className
      ? "." + element.className.split(" ").join(".")
      : "";
    const elementId = element.id ? `#${element.id}` : "";

    const elementName = `${element.tagName}${elementId}${className}:${elementTestId}`;

    const parentElementName = this.getElementName(
      element.parentElement,
      depth + 1,
    );

    return `${parentElementName} > ${elementName}`;
  }

  private kebabToScreamingSnakeCase(str: string) {
    return str.replace(/-/g, "_").toUpperCase();
  }

  private pushPaintTimingToSpan(entry: PerformanceEntry) {
    const paintSpan = startNestedSpan(
      this.kebabToScreamingSnakeCase(entry.name),
      this.rootSpan,
      {},
      0,
    );

    paintSpan.end(entry.startTime);
  }

  private pushLcpTimingToSpan(entry: LargestContentfulPaint) {
    const { element, entryType, loadTime, renderTime, startTime, url } = entry;

    const lcpSpan = startNestedSpan(
      this.kebabToScreamingSnakeCase(entryType),
      this.rootSpan,
      {
        url,
        renderTime,
        element: this.getElementName(element),
        entryType,
        loadTime,
        pageHiddenFor: this.pageHiddenFor,
      },
      0,
    );

    lcpSpan.end(startTime);
  }

  private pushNavigationTimingToSpan(
    entry: PerformanceNavigationTiming | NavigationTimingPolyfillEntry,
  ) {
    const {
      connectEnd,
      connectStart,
      domainLookupEnd,
      domainLookupStart,
      domComplete,
      domContentLoadedEventEnd,
      domContentLoadedEventStart,
      domInteractive,
      entryType,
      fetchStart,
      loadEventEnd,
      loadEventStart,
      name: url,
      redirectEnd,
      redirectStart,
      requestStart,
      responseEnd,
      responseStart,
      secureConnectionStart,
      startTime: navigationStartTime,
      type: navigationType,
      unloadEventEnd,
      unloadEventStart,
      workerStart,
    } = entry;

    this.rootSpan.setAttributes({
      connectEnd,
      connectStart,
      decodedBodySize:
        (entry as PerformanceNavigationTiming).decodedBodySize || 0,
      domComplete,
      domContentLoadedEventEnd,
      domContentLoadedEventStart,
      domInteractive,
      domainLookupEnd,
      domainLookupStart,
      encodedBodySize:
        (entry as PerformanceNavigationTiming).encodedBodySize || 0,
      entryType,
      fetchStart,
      initiatorType:
        (entry as PerformanceNavigationTiming).initiatorType || "navigation",
      loadEventEnd,
      loadEventStart,
      nextHopProtocol:
        (entry as PerformanceNavigationTiming).nextHopProtocol || "",
      redirectCount: (entry as PerformanceNavigationTiming).redirectCount || 0,
      redirectEnd,
      redirectStart,
      requestStart,
      responseEnd,
      responseStart,
      secureConnectionStart,
      navigationStartTime,
      transferSize: (entry as PerformanceNavigationTiming).transferSize || 0,
      navigationType,
      url,
      unloadEventEnd,
      unloadEventStart,
      workerStart,
    });

    this.rootSpan?.end(entry.domContentLoadedEventEnd);
  }

  private observeResourceTimings() {
    this.resourceTimingObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      const resources = this.getResourcesToTrack(entries);
      resources.forEach((entry) => {
        this.pushResourceTimingToSpan(entry);
      });
    });

    this.resourceTimingObserver.observe({
      type: "resource",
      buffered: true,
    });
  }

  private getResourcesToTrack(resources: PerformanceResourceTiming[]) {
    return resources.filter(({ name }) => {
      return !this.ignoreResourceUrls.some((ignoreUrl) =>
        name.includes(ignoreUrl),
      );
    });
  }

  private pushResourceTimingToSpan(entry: PerformanceResourceTiming) {
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

    resourceSpan.end(entry.startTime + entry.responseEnd);
  }

  private getResourceEntryKey(entry: PerformanceResourceTiming) {
    return `${entry.name}:${entry.startTime}:${entry.entryType}`;
  }

  private pollResourceTimingEntries() {
    if (this.resourceEntryPollTimeout) {
      clearInterval(this.resourceEntryPollTimeout);
    }

    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];

    const filteredResources = this.getResourcesToTrack(resources);

    filteredResources.forEach((entry) => {
      const key = this.getResourceEntryKey(entry);
      if (!this.resourceEntriesSet.has(key)) {
        this.pushResourceTimingToSpan(entry);
        this.resourceEntriesSet.add(key);
      }
    });

    this.resourceEntryPollTimeout = setTimeout(
      this.pollResourceTimingEntries,
      5000,
    );
  }

  disable(): void {
    if (this.resourceTimingObserver) {
      this.resourceTimingObserver.disconnect();
    }

    if (this.rootSpan) {
      this.rootSpan.end();
    }
  }
}
