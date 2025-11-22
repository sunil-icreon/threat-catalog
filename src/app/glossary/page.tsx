"use client";

import { Container, Accordion, Row, Col, Badge } from "react-bootstrap";
import Header from "@/components/Header";
import GlossaryIndex from "@/components/GlossaryIndex";

interface GlossaryTerm {
  term: string;
  fullName: string;
  description: string;
  example?: string;
  link?: string;
  category: string;
}

const glossaryTerms: GlossaryTerm[] = [
  // Identifiers
  {
    term: "CVE",
    fullName: "Common Vulnerabilities and Exposures",
    description:
      "Think of CVEs as the 'license plates' for security vulnerabilities. Every publicly disclosed security flaw gets a unique identifier that security professionals worldwide use to communicate about threats. This standardization prevents confusion and ensures everyone talks about the same vulnerability.",
    example:
      "CVE-2021-44228 (Log4Shell) was a critical vulnerability in Apache Log4j that allowed remote code execution. When security teams say 'CVE-2021-44228,' everyone immediately knows which vulnerability they're discussing, regardless of language or location.",
    link: "https://cve.mitre.org/",
    category: "Identifiers"
  },
  {
    term: "CWE",
    fullName: "Common Weakness Enumeration",
    description:
      "CWEs are like a 'taxonomy of bugs'—they categorize the root causes of vulnerabilities, not the vulnerabilities themselves. While a CVE identifies a specific flaw in a specific product, CWE describes the type of mistake that led to that flaw.",
    example:
      "CWE-79 (Cross-site Scripting) describes a category of vulnerabilities where untrusted data is included in web pages without proper sanitization. Thousands of different CVEs might be classified under CWE-79, but they all share the same underlying weakness pattern.",
    link: "https://cwe.mitre.org/",
    category: "Identifiers"
  },
  {
    term: "Advisory ID",
    fullName: "Security Advisory Identifier",
    description:
      "Each security organization uses its own naming system for vulnerability reports. These IDs help you track vulnerabilities from their original source and find detailed remediation guidance specific to that organization's platform or ecosystem.",
    example:
      "GHSA-xxxx-xxxx-xxxx (GitHub Security Advisory), OSV-2021-1234 (Open Source Vulnerabilities), or SNYK-JS-LODASH-123456 (Snyk) are all advisory IDs. A single vulnerability might have multiple advisory IDs from different sources, but they all reference the same underlying issue.",
    category: "Identifiers"
  },
  // Scoring Systems
  {
    term: "CVSS",
    fullName: "Common Vulnerability Scoring System",
    description:
      "CVSS is the 'universal language' for vulnerability severity. It transforms complex security assessments into a simple 0-10 number that tells you how bad a vulnerability really is. The score considers multiple factors: Can it be exploited over the network? How easy is it to exploit? What's the potential damage?",
    example:
      "A CVSS 9.8 score means 'exploitable remotely, no authentication needed, complete system compromise'—patch immediately! A CVSS 3.1 might mean 'requires local access and user interaction'—still important, but less urgent.",
    link: "https://www.first.org/cvss/",
    category: "Scoring Systems"
  },
  {
    term: "Score",
    fullName: "CVSS Base Score",
    description:
      "The CVSS score is your vulnerability 'danger meter.' It's calculated from multiple technical factors and gives you an objective way to compare threats. Higher numbers = higher priority. Most organizations use this score to decide what gets patched first.",
    example:
      "Score 9.8 (Critical): Remote code execution in a web server—fix today. Score 6.5 (Medium): Information disclosure requiring authentication—fix this sprint. Score 2.5 (Low): Denial of service in a non-critical feature—fix when convenient.",
    category: "Scoring Systems"
  },
  {
    term: "EPSS",
    fullName: "Exploit Prediction Scoring System",
    description:
      "EPSS answers the critical question: 'Will attackers actually use this vulnerability?' CVSS tells you how bad it could be; EPSS tells you how likely it is to happen. It uses machine learning on real-world exploit data to predict the probability of exploitation within 30 days.",
    example:
      "A vulnerability with EPSS 95% means there's a 95% chance it will be exploited in the wild within 30 days—even if the CVSS is only 7.5, patch it immediately! An EPSS of 2% with CVSS 9.0 might be less urgent if it's not actively being exploited yet.",
    link: "https://www.first.org/epss/",
    category: "Scoring Systems"
  },
  {
    term: "Severity",
    fullName: "Vulnerability Severity Level",
    description:
      "Severity is your quick 'triage label' for vulnerabilities. It's a simplified version of CVSS scores that helps teams quickly categorize and prioritize. Think of it as traffic lights for security: Critical (red), High (orange), Medium (yellow), Low (green).",
    example:
      "CRITICAL: Remote code execution in production API—drop everything and fix. HIGH: SQL injection in admin panel—fix this week. MEDIUM: Cross-site scripting in user comments—fix this month. LOW: Information leak in error messages—fix in next release.",
    category: "Scoring Systems"
  },
  // CVSS Exploitability Metrics
  {
    term: "Attack Vector",
    fullName: "CVSS Attack Vector",
    description:
      "Attack Vector measures 'how far away' an attacker needs to be to exploit the vulnerability. The more remote the attacker can be, the higher the risk—because more attackers can potentially reach it. Think of it as the 'attack distance' metric.",
    example:
      "Network (most dangerous): Attacker can exploit from anywhere on the internet—millions of potential attackers. Adjacent Network: Attacker must be on the same local network (WiFi, VPN). Local: Attacker needs physical or logical access to the system. Physical: Attacker must physically touch the device—very few potential attackers.",
    category: "Scoring Systems"
  },
  {
    term: "Attack Complexity",
    fullName: "CVSS Attack Complexity",
    description:
      "Attack Complexity measures how difficult it is for an attacker to bypass security controls and successfully exploit the vulnerability. It captures the technical hurdles an attacker must overcome—like defeating ASLR, bypassing authentication, or crafting specific exploit conditions.",
    example:
      "Low: The vulnerability can be exploited reliably and repeatedly without special conditions—just send a malformed request. High: The attacker must overcome security mechanisms like ASLR, stack canaries, or timing attacks. A vulnerability requiring 'Low' complexity is much more dangerous because script kiddies can exploit it, not just advanced attackers.",
    category: "Scoring Systems"
  },
  {
    term: "Attack Requirements",
    fullName: "CVSS Attack Requirements",
    description:
      "Attack Requirements capture the specific deployment or execution conditions needed for exploitation. Unlike security controls (which are intentional protections), these are natural system characteristics that happen to make exploitation possible or easier.",
    example:
      "A vulnerability might require the system to be running in a specific configuration, using certain network protocols, or having particular features enabled. For instance, a web server vulnerability might only be exploitable when running in development mode, or a database flaw might require a specific connection string format.",
    category: "Scoring Systems"
  },
  {
    term: "Privileges Required",
    fullName: "CVSS Privileges Required",
    description:
      "This metric asks: 'What level of access does the attacker need before they can exploit this?' The fewer privileges required, the more dangerous the vulnerability—because more users (or compromised accounts) can trigger it.",
    example:
      "None: Anyone can exploit it, even unauthenticated users—extremely dangerous. Low: Requires a regular user account (which attackers often obtain through phishing or credential stuffing). High: Requires administrator or root access—still dangerous if an admin account is compromised, but fewer potential attackers.",
    category: "Scoring Systems"
  },
  {
    term: "User Interaction",
    fullName: "CVSS User Interaction",
    description:
      "User Interaction measures whether the attack can happen automatically or requires a human victim to do something. Vulnerabilities that don't need user interaction are more dangerous because attackers can exploit them at will, without tricking anyone.",
    example:
      "None: The attacker can exploit it automatically—just send a request and the system is compromised. This is why Log4Shell (CVE-2021-44228) was so devastating. Required: The victim must click a link, open a file, or visit a malicious website. This adds a layer of protection but social engineering can still make it effective.",
    category: "Scoring Systems"
  },
  // CVSS Impact Metrics
  {
    term: "Confidentiality Impact",
    fullName: "CVSS Confidentiality Impact",
    description:
      "Confidentiality Impact measures how much sensitive information an attacker can access if they successfully exploit the vulnerability. This could be user data, passwords, API keys, business secrets, or any information that should be protected. When Scope is Changed, this metric applies to the subsequent system (the system beyond the vulnerable component).",
    example:
      "High: Attacker can read all data in the database, including passwords and personal information. Medium: Attacker can access some sensitive data but not everything. None: The vulnerability doesn't allow information disclosure—maybe it's just a denial of service or requires information the attacker already has. If Scope is Changed, a vulnerability in a web app might allow reading data from the underlying database server (subsequent system).",
    category: "Scoring Systems"
  },
  {
    term: "Integrity Impact",
    fullName: "CVSS Integrity Impact",
    description:
      "Integrity Impact measures how much an attacker can modify or corrupt data if they successfully exploit the vulnerability. This includes changing files, database records, system configurations, or even the ability to repudiate actions (deny they happened). When Scope is Changed, this metric applies to the subsequent system.",
    example:
      "High: Attacker can modify critical system files, database records, or user data—potentially causing data corruption or fraud. Medium: Attacker can modify some data but not critical system components. None: The vulnerability doesn't allow data modification—maybe it only allows reading or crashing the system. If Scope is Changed, a container escape vulnerability might allow modifying files on the host system (subsequent system).",
    category: "Scoring Systems"
  },
  {
    term: "Availability Impact",
    fullName: "CVSS Availability Impact",
    description:
      "Availability Impact measures how much the vulnerability can disrupt service or make resources unavailable. This includes crashing services, consuming resources (CPU, memory, bandwidth), or making systems unresponsive. When Scope is Changed, this metric applies to the subsequent system.",
    example:
      "High: Attacker can completely crash the service or make it permanently unavailable—think DDoS attacks or system crashes. Medium: Attacker can cause partial service disruption or performance degradation. None: The vulnerability doesn't affect availability—the system continues running normally even if exploited. If Scope is Changed, a hypervisor vulnerability might allow crashing the host system, affecting all virtual machines running on it.",
    category: "Scoring Systems"
  },
  {
    term: "Scope",
    fullName: "CVSS Scope",
    description:
      "Scope determines whether exploiting the vulnerability affects only the vulnerable component (Unchanged) or can impact other systems beyond it (Changed). When scope is Changed, the impact can spread to other parts of the system or even other systems entirely.",
    example:
      "Unchanged: The vulnerability only affects the vulnerable component itself. For example, a bug in a web application only affects that application. Changed: The vulnerability can 'escape' and affect other systems. For instance, a vulnerability in a hypervisor could allow escaping to the host system, or a web app bug could allow accessing the underlying database server.",
    category: "Scoring Systems"
  },
  // Vulnerability Types
  {
    term: "Zero-Day Vulnerability",
    fullName: "Zero-Day Vulnerability",
    description:
      "A zero-day is the security equivalent of being attacked by an invisible enemy. It's a vulnerability that's actively being exploited in the wild, but the software vendor doesn't know about it yet—meaning there's no patch, no workaround, and you're completely exposed.",
    example:
      "In 2021, attackers discovered a zero-day in Microsoft Exchange Server (CVE-2021-26855) and began exploiting it before Microsoft knew it existed. By the time Microsoft released a patch, thousands of organizations had already been compromised. This is why zero-days are so feared—you're vulnerable from day zero.",
    category: "Vulnerability Types"
  },
  // Package Information
  {
    term: "Ecosystem",
    fullName: "Package Ecosystem",
    description:
      "Think of ecosystems as different 'app stores' for code. Each programming language and platform has its own package manager and repository where developers share libraries. A vulnerability in one ecosystem doesn't affect others, but you need to check the right ecosystem for your stack.",
    example:
      "If you're building a Node.js app, check npm. Java project? Check Maven. .NET application? Check NuGet. A vulnerability in 'lodash' (npm) won't affect your Java project, but if you use lodash in your Node.js backend, you need to check npm advisories.",
    category: "Package Information"
  },
  {
    term: "Affected Versions",
    fullName: "Vulnerable Version Range",
    description:
      "This tells you exactly which versions of a package are vulnerable. It's like knowing which batch of products has a recall—you need to check if your specific version is affected. Version ranges use semantic versioning to specify vulnerable versions precisely.",
    example:
      "If a vulnerability affects '>=1.2.0 <2.0.0', then version 1.2.5 is vulnerable, but 1.1.9 and 2.0.0 are safe. If you're running 1.5.3, you're vulnerable and need to upgrade. Always check your package.json, pom.xml, or .csproj file to see which version you're actually using.",
    category: "Package Information"
  },
  {
    term: "Patched Version",
    fullName: "Fixed or Patched Version",
    description:
      "This is your 'safe harbor'—the minimum version number where the vulnerability has been fixed. Upgrading to this version (or any later version) removes the security risk. If no patched version exists, the vulnerability is unpatched and you may need workarounds or alternative packages.",
    example:
      "If a vulnerability affects lodash <4.17.21 and the patched version is 4.17.21, upgrading from 4.17.20 to 4.17.21 fixes it. You can also upgrade to 4.17.22, 4.18.0, or any newer version—they're all safe. If you see 'No fix available,' consider removing the package or implementing a workaround.",
    category: "Package Information"
  },
  // Status & Metadata
  {
    term: "Status",
    fullName: "Vulnerability Status",
    description:
      "Status tells you the current 'state of play' for a vulnerability. Is it still a threat? Has it been fixed? Is there a workaround? This helps you understand what actions you can take and how urgent the situation is.",
    example:
      "ACTIVE: The vulnerability exists and can be exploited right now—you need to patch or mitigate immediately. RESOLVED: A fix has been released and applied—you're safe if you've updated. MITIGATED: There's a workaround (like disabling a feature) but no permanent fix yet—implement the workaround while waiting for a patch.",
    category: "Status & Metadata"
  },
  {
    term: "Source",
    fullName: "Vulnerability Data Source",
    description:
      "Different organizations track vulnerabilities for different ecosystems and purposes. The source tells you where the vulnerability information came from, which helps you understand the context and find additional resources or remediation guidance.",
    example:
      "OSV (Open Source Vulnerabilities): Great for open-source packages across multiple ecosystems. Snyk: Excellent for npm, Maven, and Python with detailed remediation advice. GHSA (GitHub): Focuses on vulnerabilities in packages hosted on GitHub. Each source may have different details, so checking multiple sources can give you a complete picture.",
    category: "Status & Metadata"
  },
  {
    term: "Published Date",
    fullName: "Vulnerability Publication Date",
    description:
      "The publication date is like a 'discovery timestamp'—it tells you when the vulnerability became public knowledge. Older vulnerabilities that are still unpatched are particularly concerning, as attackers have had more time to develop exploits and target systems.",
    example:
      "A vulnerability published yesterday with no patch yet is urgent but may not be widely exploited. A vulnerability published 6 months ago that's still ACTIVE is extremely dangerous—attackers have had time to weaponize it, and automated scanners are likely checking for it. The longer a vulnerability has been public, the higher the risk.",
    category: "Status & Metadata"
  }
];

const categories = [
  "Identifiers",
  "Scoring Systems",
  "Vulnerability Types",
  "Package Information",
  "Status & Metadata"
];

const categoryBadgeColors: Record<string, string> = {
  Identifiers: "primary",
  "Scoring Systems": "danger",
  "Vulnerability Types": "warning",
  "Package Information": "success",
  "Status & Metadata": "info"
};

export default function GlossaryPage() {
  const groupedTerms = categories.map((category) => ({
    category,
    terms: glossaryTerms.filter((term) => term.category === category)
  }));

  // Function to highlight important terms in text
  const highlightTerms = (text: string) => {
    const importantTerms = [
      "CVE",
      "CVSS",
      "EPSS",
      "CWE",
      "Zero-Day",
      "zero-day",
      "Log4Shell",
      "Critical",
      "CRITICAL",
      "High",
      "HIGH",
      "Medium",
      "MEDIUM",
      "Low",
      "LOW",
      "Network",
      "Local",
      "Physical",
      "Adjacent Network",
      "Remote code execution",
      "SQL injection",
      "Cross-site Scripting",
      "XSS",
      "Denial of Service",
      "DDoS",
      "Authentication",
      "Authorization",
      "Privilege",
      "Exploit",
      "Vulnerability",
      "Patch",
      "Mitigation",
      "Workaround",
      "Active",
      "ACTIVE",
      "Resolved",
      "RESOLVED",
      "Mitigated",
      "MITIGATED"
    ];

    let highlightedText = text;
    importantTerms.forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        (match) => `<strong class="text-dark fw-bold">${match}</strong>`
      );
    });

    return highlightedText;
  };

  const handleTermClick = (term: string, category: string) => {
    // Find the accordion item for this category
    const categoryIndex = categories.indexOf(category);
    if (categoryIndex !== -1) {
      const accordionItem = document.querySelector(
        `[data-accordion-key="${categoryIndex}"]`
      ) as HTMLElement;
      if (accordionItem) {
        // Expand the accordion if collapsed
        const accordionButton = accordionItem.querySelector(
          ".accordion-button"
        ) as HTMLElement;
        if (accordionButton && accordionButton.classList.contains("collapsed")) {
          accordionButton.click();
        }

        // Scroll to the accordion item
        setTimeout(() => {
          accordionItem.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

          // If a specific term was clicked, try to highlight it
          if (term !== category) {
            setTimeout(() => {
              const termElement = Array.from(
                accordionItem.querySelectorAll(".border.rounded")
              ).find((el) => {
                const badge = el.querySelector(".badge");
                return badge?.textContent?.trim() === term;
              }) as HTMLElement;

              if (termElement) {
                termElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center"
                });
                termElement.style.transition = "all 0.3s";
                termElement.style.boxShadow = "0 0 0 3px rgba(13, 110, 253, 0.3)";
                setTimeout(() => {
                  termElement.style.boxShadow = "";
                }, 2000);
              }
            }, 300);
          }
        }, 100);
      }
    }
  };

  return (
    <>
      <Header />
      <Container fluid className='py-4' id='main-content'>
        <Row>
          <Col>
            <div className='mb-4'>
              <h1 className='h2 mb-2'>
                <i className='bi bi-book me-2' aria-hidden='true'></i>
                Security Terms Glossary
              </h1>
              <p className='text-muted'>
                Brief explanations of security terminology and jargon used
                throughout the vulnerability display interface.
              </p>
            </div>

            <GlossaryIndex
              categories={categories}
              terms={glossaryTerms.map((t) => ({
                term: t.term,
                category: t.category
              }))}
              onTermClick={handleTermClick}
            />

            <Accordion defaultActiveKey='0' className='mb-4'>
              {groupedTerms.map(({ category, terms }, index) => (
                <Accordion.Item
                  key={category}
                  eventKey={index.toString()}
                  className='mb-3 shadow-sm'
                  data-accordion-key={index}
                >
                  <Accordion.Header className='bg-light'>
                    <h3 className='h5 mb-0 fw-semibold'>
                      <i className='bi bi-tag me-2' aria-hidden='true'></i>
                      {category}
                    </h3>
                  </Accordion.Header>
                  <Accordion.Body className='py-3'>
                    <Row className='g-3'>
                      {terms.map((term) => (
                        <Col key={term.term} xs={12} md={6} lg={4}>
                          <div className='h-100 p-3 border rounded'>
                            <div className='d-flex align-items-start mb-2'>
                              <Badge
                                bg={categoryBadgeColors[term.category] || "primary"}
                                className='me-2 flex-shrink-0 fw-semibold'
                                style={{ fontSize: "0.75rem" }}
                              >
                                {term.term}
                              </Badge>
                              {term.link && (
                                <a
                                  href={term.link}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-decoration-none ms-auto'
                                  title={`Learn more about ${term.term}`}
                                  aria-label={`External link to ${term.fullName}`}
                                >
                                  <i
                                    className='bi bi-box-arrow-up-right'
                                    aria-hidden='true'
                                  ></i>
                                </a>
                              )}
                            </div>
                            <div className='small text-muted mb-2 fw-semibold'>
                              {term.fullName}
                            </div>
                            <p
                              className='small mb-2'
                              style={{ lineHeight: "1.6" }}
                              dangerouslySetInnerHTML={{
                                __html: highlightTerms(term.description)
                              }}
                            />
                            {term.example && (
                              <div className='mt-3 pt-2 border-top'>
                                <div className='small fw-semibold text-primary mb-1'>
                                  <i className='bi bi-lightbulb me-1'></i>
                                  Real-world example:
                                </div>
                                <p
                                  className='small mb-0 text-muted'
                                  style={{ lineHeight: "1.6", fontStyle: "italic" }}
                                  dangerouslySetInnerHTML={{
                                    __html: highlightTerms(term.example)
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Col>
        </Row>
      </Container>
    </>
  );
}

