"use client";

import Link from "next/link";
import { Container, Nav, Navbar } from "react-bootstrap";

export default function Header() {
  return (
    <Navbar bg='dark' variant='dark' expand='lg' className='shadow-sm'>
      <Container fluid>
        <Navbar.Brand href='/' className='fw-bold'>
          <i className='bi bi-shield-check me-2'></i>
          Threat Catalog
        </Navbar.Brand>
        <Navbar.Toggle aria-controls='basic-navbar-nav' />
        <Navbar.Collapse id='basic-navbar-nav'>
          <Nav className='me-auto'>
            <Nav.Link as={Link} href='/' className='fw-medium'>
              <i className='bi bi-speedometer2 me-1'></i>
              Dashboard
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
