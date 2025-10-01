"use client";

import Link from "next/link";
import { Alert, Button, Col, Container, Row } from "react-bootstrap";

export default function NotFound() {
  return (
    <Container className='py-5'>
      <Row className='justify-content-center'>
        <Col md={8} lg={6}>
          <Alert variant='info' className='text-center'>
            <Alert.Heading>
              <i className='bi bi-search me-2'></i>
              404 - Page Not Found
            </Alert.Heading>
            <p className='mb-3'>
              {`The page you're looking for doesn't exist or has been moved.`}
            </p>
            <div className='d-flex gap-2 justify-content-center'>
              <Link href='/' passHref>
                <Button variant='primary'>
                  <i className='bi bi-house me-1'></i>
                  Go Home
                </Button>
              </Link>
              <Button
                variant='outline-secondary'
                onClick={() => window.history.back()}
              >
                <i className='bi bi-arrow-left me-1'></i>
                Go Back
              </Button>
            </div>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
}
