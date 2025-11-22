"use client";

import { useEffect, useState } from "react";
import { Badge, Card, Table } from "react-bootstrap";

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

export default function GlossaryIndex({
  categories,
  terms,
  onTermClick
}: GlossaryIndexProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const groupedTerms = categories.map((category) => ({
    category,
    terms: terms.filter((t) => t.category === category)
  }));

  if (isMobile) {
    // Mobile: Card layout
    return (
      <div className='mb-4'>
        {groupedTerms.map(({ category, terms }) => (
          <Card key={category} className='mb-3 shadow-sm'>
            <Card.Header
              className={`bg-${categoryColors[category]} text-white`}
            >
              <h6 className='mb-0 fw-bold'>{category}</h6>
            </Card.Header>
            <Card.Body className='p-2'>
              {terms.map((term) => (
                <div
                  key={term.term}
                  className='p-2 mb-2 border rounded'
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onClick={() => onTermClick(term.term, term.category)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "";
                    e.currentTarget.style.transform = "";
                  }}
                >
                  <div className='d-flex align-items-center'>
                    <Badge
                      bg={categoryColors[category]}
                      className='me-2'
                      style={{ fontSize: "0.75rem" }}
                    >
                      {term.term}
                    </Badge>
                    <i className='bi bi-arrow-right ms-auto text-muted'></i>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        ))}
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
                    <Badge
                      bg={categoryColors[category]}
                      className='fw-semibold'
                    >
                      {category}
                    </Badge>
                  </td>
                  <td>
                    <div className='d-flex flex-wrap gap-2'>
                      {terms.map((term) => (
                        <span
                          key={term.term}
                          className='badge bg-light text-dark border'
                          style={{
                            cursor: "pointer",
                            transition: "all 0.2s",
                            fontSize: "0.875rem"
                          }}
                          onClick={() => onTermClick(term.term, term.category)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              categoryColors[category];
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "";
                            e.currentTarget.style.color = "";
                            e.currentTarget.style.transform = "";
                          }}
                        >
                          {term.term}
                        </span>
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
