"use client";

import React from "react";
import { Alert, Button, Col, Container, Row } from "react-bootstrap";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <Container className='py-5'>
      <Row className='justify-content-center'>
        <Col md={8} lg={6}>
          <Alert variant='danger' className='text-center'>
            <Alert.Heading>
              <i className='bi bi-exclamation-triangle me-2'></i>
              Something went wrong!
            </Alert.Heading>
            <p className='mb-3'>
              We encountered an unexpected error. Please try again or contact
              support if the problem persists.
            </p>
            {process.env.NODE_ENV === "development" && (
              <details className='mb-3'>
                <summary>Error Details (Development Only)</summary>
                <pre className='mt-2 text-start small'>
                  {error.message}
                  {error.stack && `\n\nStack trace:\n${error.stack}`}
                </pre>
              </details>
            )}
            <div className='d-flex gap-2 justify-content-center'>
              <Button variant='outline-danger' onClick={reset}>
                <i className='bi bi-arrow-clockwise me-1'></i>
                Try again
              </Button>
              <Button
                variant='outline-secondary'
                onClick={() => (window.location.href = "/")}
              >
                <i className='bi bi-house me-1'></i>
                Go Home
              </Button>
            </div>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
}
