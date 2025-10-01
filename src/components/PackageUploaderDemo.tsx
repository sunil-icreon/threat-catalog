"use client";

import React, { useState } from "react";
import { Alert, Button, Card, Col, Container, Row } from "react-bootstrap";
import PackageUploader, { ProjectInfo } from "./PackageUploader";

const PackageUploaderDemo: React.FC = () => {
  const [analyzedProjects, setAnalyzedProjects] = useState<ProjectInfo[]>([]);
  const [error, setError] = useState<string>("");

  const handleProjectAnalyzed = (projectInfo: ProjectInfo) => {
    setAnalyzedProjects(prev => [...prev, projectInfo]);
    setError("");
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const clearHistory = () => {
    setAnalyzedProjects([]);
    setError("");
  };

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8}>
          <PackageUploader
            onProjectAnalyzed={handleProjectAnalyzed}
            onError={handleError}
          />
        </Col>
        
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <i className="bi bi-history me-2"></i>
                Analysis History
              </h5>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  <small>{error}</small>
                </Alert>
              )}
              
              {analyzedProjects.length === 0 ? (
                <p className="text-muted text-center">
                  <i className="bi bi-inbox d-block mb-2" style={{ fontSize: "2rem" }}></i>
                  No projects analyzed yet
                </p>
              ) : (
                <div>
                  {analyzedProjects.map((project, index) => (
                    <Card key={index} className="mb-2">
                      <Card.Body className="p-2">
                        <h6 className="mb-1">{project.name}</h6>
                        <small className="text-muted">
                          {project.ecosystem} • {project.packages.length} packages
                        </small>
                      </Card.Body>
                    </Card>
                  ))}
                  
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={clearHistory}
                    className="w-100 mt-3"
                  >
                    <i className="bi bi-trash me-2"></i>
                    Clear History
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PackageUploaderDemo;
