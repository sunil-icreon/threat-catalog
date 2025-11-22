"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Card, Table } from "react-bootstrap";

interface GlossaryTerm {
  term: string;
  category: string;
}

interface GlossaryIndexProps {
  categories: string[];
  terms: GlossaryTerm[];
  onTermClick: (term: string, category: string) => void;
}

const categoryColors: Record<string, string> = {
  Identifiers: "primary",
  "Scoring Systems": "danger",
  "Vulnerability Types": "warning",
  "Package Information": "success",
  "Status & Metadata": "info"
};

// Light, professional colors for mobile
const categoryLightColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  Identifiers: {
    bg: "#e7f1ff",
    border: "#b3d7ff",
    text: "#0a58ca"
  },
  "Scoring Systems": {
    bg: "#f8e8e8",
    border: "#f0c0c0",
    text: "#842029"
  },
  "Vulnerability Types": {
    bg: "#fff3cd",
    border: "#ffe69c",
    text: "#664d03"
  },
  "Package Information": {
    bg: "#d1e7dd",
    border: "#a3cfbb",
    text: "#0f5132"
  },
  "Status & Metadata": {
    bg: "#cff4fc",
    border: "#9eeaf9",
    text: "#055160"
  }
};

// Memoized term item component for mobile
const MobileTermItem = memo(
  ({
    term,
    lightColor,
    onTermClick
  }: {
    term: { term: string; category: string };
    lightColor: { bg: string; border: string; text: string };
    onTermClick: (term: string, category: string) => void;
  }) => {
    const handleClick = useCallback(() => {
      onTermClick(term.term, term.category);
    }, [term.term, term.category, onTermClick]);

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.backgroundColor = lightColor.bg;
        e.currentTarget.style.borderLeftColor = lightColor.text;
        e.currentTarget.style.transform = "translateX(4px)";
      },
      [lightColor]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.backgroundColor = "#f8f9fa";
        e.currentTarget.style.borderLeftColor = lightColor.border;
        e.currentTarget.style.transform = "";
      },
      [lightColor]
    );

    return (
      <div
        className='p-3 mb-2 rounded'
        style={{
          cursor: "pointer",
          transition: "all 0.2s",
          backgroundColor: "#f8f9fa",
          border: `1px solid ${lightColor.border}`,
          borderLeft: `3px solid ${lightColor.border}`
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className='d-flex align-items-center'>
          <span
            className='fw-medium'
            style={{
              color: lightColor.text,
              fontSize: "0.875rem"
            }}
          >
            {term.term}
          </span>
          <i
            className='bi bi-chevron-right ms-auto'
            style={{
              color: lightColor.text,
              fontSize: "0.75rem",
              opacity: 0.6
            }}
          ></i>
        </div>
      </div>
    );
  }
);

MobileTermItem.displayName = "MobileTermItem";

// Bootstrap color values
const bootstrapColorValues: Record<string, string> = {
  primary: "#0d6efd",
  danger: "#dc3545",
  warning: "#ffc107",
  success: "#198754",
  info: "#0dcaf0"
};

// Memoized desktop term badge
const DesktopTermBadge = memo(
  ({
    term,
    category,
    categoryColor,
    onTermClick
  }: {
    term: { term: string; category: string };
    category: string;
    categoryColor: string;
    onTermClick: (term: string, category: string) => void;
  }) => {
    const handleClick = useCallback(() => {
      onTermClick(term.term, term.category);
    }, [term.term, term.category, onTermClick]);

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        const color = bootstrapColorValues[categoryColor] || categoryColor;
        e.currentTarget.style.backgroundColor = color;
        e.currentTarget.style.color = "white";
        e.currentTarget.style.transform = "scale(1.05)";
      },
      [categoryColor]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        e.currentTarget.style.backgroundColor = "";
        e.currentTarget.style.color = "";
        e.currentTarget.style.transform = "";
      },
      []
    );

    return (
      <span
        className='badge bg-light text-dark border'
        style={{
          cursor: "pointer",
          transition: "all 0.2s",
          fontSize: "0.875rem"
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {term.term}
      </span>
    );
  }
);

DesktopTermBadge.displayName = "DesktopTermBadge";

function GlossaryIndex({ categories, terms, onTermClick }: GlossaryIndexProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Memoize grouped terms calculation
  const groupedTerms = useMemo(
    () =>
      categories.map((category) => ({
        category,
        terms: terms.filter((t) => t.category === category)
      })),
    [categories, terms]
  );

  if (isMobile) {
    // Mobile: Card layout with light, professional colors
    return (
      <div className='mb-4'>
        {groupedTerms.map(({ category, terms }) => {
          const lightColor = categoryLightColors[category] || {
            bg: "#f8f9fa",
            border: "#dee2e6",
            text: "#495057"
          };

          return (
            <Card key={category} className='mb-3 shadow-sm border-0'>
              <Card.Header
                style={{
                  backgroundColor: lightColor.bg,
                  borderBottom: `2px solid ${lightColor.border}`,
                  padding: "12px 16px"
                }}
              >
                <h6
                  className='mb-0 fw-semibold'
                  style={{ color: lightColor.text, fontSize: "0.9rem" }}
                >
                  <i
                    className='bi bi-tag-fill me-2'
                    style={{ fontSize: "0.85rem" }}
                  ></i>
                  {category}
                </h6>
              </Card.Header>
              <Card.Body className='p-3' style={{ backgroundColor: "#ffffff" }}>
                {terms.map((term) => (
                  <MobileTermItem
                    key={term.term}
                    term={term}
                    lightColor={lightColor}
                    onTermClick={onTermClick}
                  />
                ))}
              </Card.Body>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop: Table layout
  return (
    <Card className='mb-4 shadow-sm'>
      <Card.Header className='bg-light py-2'>
        <h5 className='mb-0 fw-semibold'>
          <i className='bi bi-list-ul me-2' aria-hidden='true'></i>
          Glossary Index
        </h5>
      </Card.Header>
      <Card.Body className='p-0'>
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          <Table hover className='mb-0'>
            <thead className='table-light sticky-top'>
              <tr>
                <th style={{ width: "25%" }}>Category</th>
                <th style={{ width: "75%" }}>Terms</th>
              </tr>
            </thead>
            <tbody>
              {groupedTerms.map(({ category, terms }) => (
                <tr key={category}>
                  <td className='align-middle'>
                    <span className='text-muted fw-bold'>{category}</span>
                  </td>
                  <td>
                    <div className='d-flex flex-wrap gap-2'>
                      {terms.map((term) => (
                        <DesktopTermBadge
                          key={term.term}
                          term={term}
                          category={category}
                          categoryColor={categoryColors[category]}
                          onTermClick={onTermClick}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
}

export default memo(GlossaryIndex);
