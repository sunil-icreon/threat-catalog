"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Form, ListGroup } from "react-bootstrap";

interface GlossaryTerm {
  term: string;
  fullName: string;
  category: string;
}

interface GlossarySearchProps {
  terms: GlossaryTerm[];
  onTermClick: (term: string, category: string) => void;
}

export default function GlossarySearch({
  terms,
  onTermClick
}: GlossarySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter terms based on search query
  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    return terms.filter((term) => {
      const termLower = term.term.toLowerCase();
      const fullNameLower = term.fullName.toLowerCase();
      const categoryLower = term.category.toLowerCase();

      return (
        termLower.includes(query) ||
        fullNameLower.includes(query) ||
        categoryLower.includes(query)
      );
    });
  }, [searchQuery, terms]);

  const handleTermSelect = useCallback(
    (term: string, category: string) => {
      setSearchQuery("");
      setIsFocused(false);
      setSelectedIndex(-1);
      onTermClick(term, category);
    },
    [onTermClick]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (filteredTerms.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredTerms.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredTerms.length) {
            const term = filteredTerms[selectedIndex];
            handleTermSelect(term.term, term.category);
          }
          break;
        case "Escape":
          setSearchQuery("");
          setIsFocused(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [filteredTerms, selectedIndex, handleTermSelect]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']");
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
    }
  }, [selectedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    if (isFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFocused]);

  return (
    <div ref={searchRef} className='mb-4 position-relative'>
      <Card className='shadow-sm border-0'>
        <Card.Body className='p-3'>
          <Form.Group className='position-relative'>
            <Form.Label className='fw-semibold mb-2 d-flex align-items-center'>
              <i className='bi bi-search me-2' aria-hidden='true'></i>
              Search Glossary Terms
            </Form.Label>
            <Form.Control
              ref={inputRef}
              type='text'
              placeholder='Type to search for terms, full names, or categories...'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              className='form-control-lg'
              aria-label='Search glossary terms'
              aria-expanded={isFocused && filteredTerms.length > 0}
              aria-haspopup='listbox'
              aria-activedescendant={
                selectedIndex >= 0
                  ? `search-result-${selectedIndex}`
                  : undefined
              }
            />

            {/* Dropdown results */}
            {isFocused &&
              searchQuery.trim() &&
              (filteredTerms.length > 0 ? (
                <div
                  ref={listRef}
                  className='position-absolute w-100 mt-1'
                  style={{
                    zIndex: 1000,
                    maxHeight: "400px",
                    overflowY: "auto",
                    backgroundColor: "white",
                    border: "1px solid #dee2e6",
                    borderRadius: "0.375rem",
                    boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                    left: 0,
                    right: 0
                  }}
                  role='listbox'
                >
                  <ListGroup variant='flush'>
                    {filteredTerms.map((term, index) => (
                      <ListGroup.Item
                        key={`${term.term}-${term.category}`}
                        id={`search-result-${index}`}
                        action
                        onClick={() =>
                          handleTermSelect(term.term, term.category)
                        }
                        onMouseEnter={() => setSelectedIndex(index)}
                        className='d-flex align-items-start py-3 px-3'
                        style={{
                          cursor: "pointer",
                          backgroundColor:
                            selectedIndex === index ? "#f8f9fa" : "transparent"
                        }}
                        role='option'
                        aria-selected={selectedIndex === index}
                        aria-label={`${term.term} - ${term.fullName}`}
                      >
                        <div className='flex-grow-1'>
                          <div className='d-flex align-items-center mb-1'>
                            <span className='fw-semibold text-dark me-2'>
                              {term.term}
                            </span>
                            <span
                              className='badge bg-secondary'
                              style={{ fontSize: "0.7rem" }}
                            >
                              {term.category}
                            </span>
                          </div>
                          <div className='small text-muted'>
                            {term.fullName}
                          </div>
                        </div>
                        <i
                          className='bi bi-chevron-right ms-2 text-muted'
                          aria-hidden='true'
                        ></i>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              ) : (
                <div
                  className='position-absolute w-100 mt-1 p-3 text-center text-muted'
                  style={{
                    zIndex: 1000,
                    backgroundColor: "white",
                    border: "1px solid #dee2e6",
                    borderRadius: "0.375rem",
                    boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                    left: 0,
                    right: 0
                  }}
                >
                  <i className='bi bi-search me-2' aria-hidden='true'></i>
                  No results found
                </div>
              ))}
          </Form.Group>
        </Card.Body>
      </Card>
    </div>
  );
}
