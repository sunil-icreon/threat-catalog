"use client";

import { Card, Col, Row, Table } from "react-bootstrap";

export function TableSkeleton() {
  return (
    <div className='vulnerability-table-container'>
      <Table striped hover className='mb-0'>
        <thead className='table-dark'>
          <tr>
            <th style={{ width: "50px" }}></th>
            <th style={{ width: "400px" }}></th>
            <th style={{ width: "300px" }}></th>
            <th style={{ width: "80px" }}></th>
            <th style={{ width: "100px" }}></th>
            <th style={{ width: "180px" }}></th>
            <th style={{ width: "180px" }}></th>
            <th style={{ width: "100px" }}></th>
            <th style={{ width: "80px" }}></th>
            <th style={{ width: "80px" }}></th>
            <th style={{ width: "120px" }}></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }).map((_, index) => (
            <tr key={index}>
              <td>
                <div className='skeleton-line' style={{ width: "30px", height: "16px" }} />
              </td>
              <td>
                <div className='skeleton-line' style={{ width: "80%", height: "16px" }} />
              </td>
              <td>
                <div className='skeleton-line' style={{ width: "70%", height: "16px" }} />
              </td>
              <td>
                <div className='skeleton-line' style={{ width: "60px", height: "20px", borderRadius: "4px" }} />
              </td>
              <td>
                <div className='skeleton-line' style={{ width: "50px", height: "16px" }} />
              </td>
              <td>
                <div className='skeleton-line' style={{ width: "100px", height: "16px" }} />
              </td>
              <td>
                <div className='skeleton-line' style={{ width: "100px", height: "16px" }} />
              </td>
              <td>
                <div className='skeleton-line' style={{ width: "60px", height: "16px" }} />
              </td>
              <td>
                <div className='skeleton-line' style={{ width: "50px", height: "16px" }} />
              </td>
              <td>
                <div className='skeleton-line' style={{ width: "50px", height: "16px" }} />
              </td>
              <td>
                <div className='skeleton-line' style={{ width: "80px", height: "16px" }} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Row className='g-4'>
      {Array.from({ length: 6 }).map((_, index) => (
        <Col key={index} xs={12} sm={6}>
          <Card className='custom-card mb-3 h-100' style={{ minHeight: '180px' }}>
            <Card.Body className='d-flex flex-column p-2' style={{ minHeight: '180px' }}>
              <div className='d-flex flex-wrap align-items-center gap-2 mb-2'>
                <div className='skeleton-line' style={{ width: "80px", height: "24px", borderRadius: "4px" }} />
                <div className='skeleton-line' style={{ width: "60px", height: "24px", borderRadius: "4px" }} />
                <div className='skeleton-line' style={{ width: "90px", height: "24px", borderRadius: "4px" }} />
              </div>
              <div className='mb-2'>
                <div className='skeleton-line' style={{ width: "70%", height: "20px", marginBottom: "8px" }} />
                <div className='skeleton-line' style={{ width: "90%", height: "16px" }} />
              </div>
              <div className='mb-2'>
                <div className='skeleton-line' style={{ width: "60%", height: "16px", marginBottom: "4px" }} />
                <div className='skeleton-line' style={{ width: "40%", height: "16px" }} />
              </div>
              <div className='d-flex flex-wrap align-items-center gap-2 mb-2'>
                <div className='skeleton-line' style={{ width: "100px", height: "14px" }} />
                <div className='skeleton-line' style={{ width: "60px", height: "14px" }} />
                <div className='skeleton-line' style={{ width: "80px", height: "14px" }} />
              </div>
              <div className='mt-auto pt-2 border-top'>
                <div className='skeleton-line' style={{ width: "100px", height: "16px", margin: "0 auto" }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export function StatsSkeleton() {
  return (
    <Row className='g-4 mb-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <Col key={index} xs={12} sm={6} md={3}>
          <Card className='custom-card' style={{ minHeight: '120px' }}>
            <Card.Body style={{ minHeight: '100px' }}>
              <div className='skeleton-line' style={{ width: "60%", height: "16px", marginBottom: "12px" }} />
              <div className='skeleton-line' style={{ width: "80%", height: "32px", marginBottom: "8px" }} />
              <div className='skeleton-line' style={{ width: "40%", height: "14px" }} />
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export function PageSkeleton() {
  return (
    <div>
      <StatsSkeleton />
      <CardSkeleton />
    </div>
  );
}

