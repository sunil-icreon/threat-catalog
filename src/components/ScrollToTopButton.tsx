"use client";

import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Handle scroll visibility
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      // Show button when scrolled down more than 300px
      setIsVisible(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Only render on mobile devices
  if (!isMobile || !isVisible) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      className="scroll-to-top-button"
      aria-label="Scroll to top of page"
      variant="light"
      size="lg"
    >
      <i className="bi bi-arrow-up" aria-hidden="true"></i>
    </Button>
  );
}

