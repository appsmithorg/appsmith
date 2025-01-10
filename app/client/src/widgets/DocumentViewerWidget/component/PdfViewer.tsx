import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const ViewerContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: #fff;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PageContainer = styled.div<{ rotation: number }>`
  margin: 10px 0;
  position: relative;
  transform: rotate(${(props) => props.rotation}deg);
  transition: transform 0.3s ease;
`;

const ControlsContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const RotateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;

  &:hover {
    background: #f5f5f5;
  }

  &:active {
    background: #e5e5e5;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

interface PDFViewerProps {
  url?: string;
  blob?: Blob;
}

const PDFViewer = ({ blob, url }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>(
    {},
  );
  const [activePage, setActivePage] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pagesRef = useRef<
    Map<number, { element: Element; visibility: number }>
  >(new Map());

  useEffect(() => {
    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNumber = parseInt(
            entry.target.getAttribute("data-page-number") || "0",
          );

          if (pageNumber) {
            pagesRef.current.set(pageNumber, {
              element: entry.target,
              visibility: entry.intersectionRatio,
            });
          }
        });

        // Find the page with highest visibility
        let maxVisibility = 0;
        let mostVisiblePage = null;

        pagesRef.current.forEach((data, pageNum) => {
          if (data.visibility > maxVisibility) {
            maxVisibility = data.visibility;
            mostVisiblePage = pageNum;
          }
        });

        if (mostVisiblePage && mostVisiblePage !== activePage) {
          setActivePage(mostVisiblePage);
        }
      },
      {
        threshold: Array.from({ length: 100 }, (_, i) => i / 100), // Generate thresholds from 0 to 1
        root: null, // Use viewport as root
      },
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleRotatePage = (direction: "left" | "right") => {
    if (!activePage) return;

    setPageRotations((prev) => ({
      ...prev,
      [activePage]:
        ((prev[activePage] || 0) + (direction === "left" ? -90 : 90)) % 360,
    }));
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setActivePage(1);
  }

  // Determine the file prop based on whether we have a URL or blob
  const file = blob || url;

  if (!file) {
    return null;
  }

  return (
    <ViewerContainer>
      <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from(new Array(numPages), (_, index) => {
          const pageNumber = index + 1;

          return (
            <PageContainer
              key={`page_${pageNumber}`}
              ref={(element) => {
                if (element && observerRef.current) {
                  element.setAttribute(
                    "data-page-number",
                    pageNumber.toString(),
                  );
                  observerRef.current.observe(element);
                }
              }}
              rotation={pageRotations[pageNumber] || 0}
            >
              <Page
                key={`page_${pageNumber}`}
                pageNumber={pageNumber}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </PageContainer>
          );
        })}
      </Document>
      <ControlsContainer>
        <RotateButton
          aria-label="Rotate active page left"
          disabled={!activePage}
          onClick={() => handleRotatePage("left")}
          tabIndex={0}
          title="Rotate left"
        >
          ↺
        </RotateButton>
        <RotateButton
          aria-label="Rotate active page right"
          disabled={!activePage}
          onClick={() => handleRotatePage("right")}
          tabIndex={0}
          title="Rotate right"
        >
          ↻
        </RotateButton>
      </ControlsContainer>
    </ViewerContainer>
  );
};

export default PDFViewer;
