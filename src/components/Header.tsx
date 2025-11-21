"use client";

import Link from "next/link";
import { Container, Nav, Navbar } from "react-bootstrap";

export default function Header() {
  return (
    <>
      <a href='#main-content' className='skip-link'>
        Skip to main content
      </a>
      <Navbar bg='dark' variant='dark' expand='lg' className='shadow-sm' role='navigation' aria-label='Main navigation'>
        <Container fluid>
          <Navbar.Brand href='/' className='fw-bold' aria-label='Threat Catalog home'>
            <i className='bi bi-shield-check me-2' aria-hidden='true'></i>
            Threat Catalog
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='basic-navbar-nav' aria-label='Toggle navigation menu' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='me-auto' role='menubar'>
              <Nav.Link as={Link} href='/' className='fw-medium' role='menuitem' aria-label='Go to dashboard'>
                <i className='bi bi-speedometer2 me-1' aria-hidden='true'></i>
                Dashboard
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}
