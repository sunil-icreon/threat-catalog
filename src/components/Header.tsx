"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";

function HeaderContent() {
  const searchParams = useSearchParams();
  const showAnalyze = searchParams.get("pa") === "e";

  return (
    <>
      <a href='#main-content' className='skip-link'>
        Skip to main content
      </a>
      <Navbar
        bg='dark'
        variant='dark'
        expand='lg'
        className='shadow-sm'
        role='navigation'
        aria-label='Main navigation'
      >
        <Container fluid>
          <Navbar.Brand
            href='/'
            className='fw-bold'
            aria-label='Threat Catalog home'
          >
            <i className='bi bi-shield-check me-2' aria-hidden='true'></i>
            Threat Catalog
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls='basic-navbar-nav'
            aria-label='Toggle navigation menu'
          />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='me-auto' role='menubar'>
              <Nav.Link
                as={Link}
                href='/'
                className='fw-medium'
                role='menuitem'
                aria-label='Go to dashboard'
              >
                <i className='bi bi-speedometer2 me-1' aria-hidden='true'></i>
                Dashboard
              </Nav.Link>
             
              <Nav.Link
                as={Link}
                href='/glossary'
                className='fw-medium'
                role='menuitem'
                aria-label='View glossary of security terms'
              >
                <i className='bi bi-book me-1' aria-hidden='true'></i>
                Glossary
              </Nav.Link>

              {showAnalyze && (
                <Nav.Link
                  as={Link}
                  href='/analyze?pa=e'
                  className='fw-medium'
                  role='menuitem'
                  aria-label='Analyze packages'
                >
                  <i className='bi bi-search me-1' aria-hidden='true'></i>
                  Analyze
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}

export default function Header() {
  return (
    <Suspense fallback={
      <Navbar bg='dark' variant='dark' expand='lg' className='shadow-sm'>
        <Container fluid>
          <Navbar.Brand href='/' className='fw-bold'>
            <i className='bi bi-shield-check me-2' aria-hidden='true'></i>
            Threat Catalog
          </Navbar.Brand>
        </Container>
      </Navbar>
    }>
      <HeaderContent />
    </Suspense>
  );
}
