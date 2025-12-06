"use client";
import { PackageAnalysisResult } from "@/types/packageAnalysis";
import { Card, Col, Row } from "react-bootstrap";

interface PackageAnalysisStatsProps {
  packages: PackageAnalysisResult[];
}

export default function PackageAnalysisStats({
  packages
}: PackageAnalysisStatsProps) {
  const total = packages.length;
  const inProcess = packages.filter((pkg) => pkg.status === "processing").length;
  const pending = packages.filter((pkg) => pkg.status === "pending").length;
  const completed = packages.filter((pkg) => pkg.status === "completed").length;
  const failed = packages.filter((pkg) => pkg.status === "error").length;

  const stats = [
    { label: "Total Packages", value: total, variant: "primary" },
    { label: "In Process", value: inProcess, variant: "warning" },
    { label: "Pending", value: pending, variant: "info" },
    { label: "Completed", value: completed, variant: "success" },
    { label: "Failed", value: failed, variant: "danger" }
  ];

  return (
    <Row className="mb-4">
      {stats.map((stat) => (
        <Col key={stat.label} xs={12} sm={6} md={4} lg={2.4} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="h3 mb-1">{stat.value}</Card.Title>
              <Card.Text className="text-muted small mb-0">
                {stat.label}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

