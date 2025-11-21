import { ILatestQueryFilterType } from "@/components/DashboardContent";

import {
  IEcoSystemType,
  ISecerityType,
  IVulnerabilityType,
  PackageInfo,
  SEVERITY_TYPE
} from "@/types/vulnerability";

const VULNERABILITY_TYPE = {
  VULNERABILITY: 1,
  MALWARE: 2
};

const GHSA_HELPER = {
  vulnerabilityMapper: (response: Array<any>, ecoSystem: IEcoSystemType) => {
    let vulnerabilities: Array<IVulnerabilityType> = [];

    response.map((vul: any) => {
      const packageInfo = vul.vulnerabilities[0];

      vulnerabilities = [
        ...vulnerabilities,
        {
          id: vul.ghsa_id,
          cve_id: vul.cve_id,
          detailURL: vul.html_url,
          packageName: packageInfo?.package?.name,
          version: packageInfo?.vulnerable_version_range,
          patchedVersion: packageInfo?.first_patched_version,
          severity: vul.severity?.toUpperCase(),
          summary: vul.summary,
          source: "GHSA",
          affectedVersions: [packageInfo?.vulnerable_version_range],
          publishedDate: vul.published_at,
          modifiedDate: vul.updated_at,
          type:
            vul.type === "malware"
              ? VULNERABILITY_TYPE.MALWARE
              : VULNERABILITY_TYPE.VULNERABILITY,
          score:
            vul?.cvss_severities?.cvss_v4?.score ??
            vul?.cvss_severities?.cvss_v3?.score,
          score_vector:
            vul?.cvss_severities?.cvss_v4?.vector_string ??
            vul?.cvss_severities?.cvss_v3?.vector_string,
          // description: vul.description,
          reviewed: vul.type === "reviewed",
          cvss: vul.cvss,
          cvss_severities: vul.cvss_severities,
          epss: vul.epss,
          weaknesses: vul.cwes?.map((cwe: any) => ({
            id: cwe.cwe_id,
            name: cwe.name
          })),
          ecosystem: ecoSystem.toLocaleLowerCase() as IEcoSystemType,
          references: vul.references,
          source_code_location: vul.source_code_location,
          review_type: vul.type,
          aliases: vul.aliases
        }
      ];
    });

    return vulnerabilities;
  },
  fetchGithubAdvisoriesForPackages: async (
    packages: string,
    ecoSystem: string
  ) => {
    const apiURL = `https://api.github.com/advisories?ecosystem=${ecoSystem}&affects=${packages}`;

    const res = await fetch(apiURL);

    if (!res.ok) {
      return [];
    }

    const response = await res.json();

    let vulnerabilities: Array<IVulnerabilityType> =
      GHSA_HELPER.vulnerabilityMapper(response, ecoSystem as IEcoSystemType);

    return vulnerabilities;
  },
  fetchGithubAdvisories: async (
    publishDuration: number,
    filterData: ILatestQueryFilterType
  ) => {
    const { ecosystem = "NPM" } = filterData;
    const { fromDate, endDate } = getStartEndDates(publishDuration);

    const apiURL = `https://api.github.com/advisories?ecosystem=${ecosystem.toLowerCase()}&per_page=100&published=${fromDate}..${endDate}`;

    const res = await fetch(apiURL);

    if (!res.ok) {
      return [];
    }

    const response = await res.json();

    let vulnerabilities: Array<IVulnerabilityType> =
      GHSA_HELPER.vulnerabilityMapper(response, ecosystem);

    return vulnerabilities;
  }
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const fetchInBatches = async (
  items: Array<string>,
  ecoSystem: string,
  batchSize = 50,
  delay = 1500
) => {
  let allVuls: Array<any> = [];
  const totalBatches = Math.ceil(items.length / batchSize);
  // helper: sleep for given ms
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  let ctr = 0;
  // split into chunks of batchSize
  for (let i = 0; i < items.length; i += batchSize) {
    ctr++;
    const batch = items.slice(i, i + batchSize);

    try {
      const response = await GHSA_HELPER.fetchGithubAdvisoriesForPackages(
        batch.join(","),
        ecoSystem
      );
      allVuls = [...allVuls, ...response];
    } catch (err) {
      console.error(`Batch failed: ${i}`, err);
    }
    // wait before the next batch, but skip wait after last batch
    if (i + batchSize < items.length) {
      await sleep(delay);
    }
  }

  console.log("✅ All batches completed");
  return allVuls;
};

export const findVulnerabilitiesInPackage = async (projectInfo: any) => {
  const { packages, ecosystem } = projectInfo;

  const packagesStr = packages
    .filter((pkg: PackageInfo) => pkg.name.trim() !== "")
    .map((pkg: PackageInfo) => `${pkg.name}@${pkg.version}`);

  const finalResul = await fetchInBatches(packagesStr, ecosystem);

  return finalResul;
};

///

const getStartEndDates = (daysBack: number = 7) => {
  const today = new Date();

  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - daysBack);

  const fromDate = weekAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  return {
    fromDate,
    endDate
  };
};

const OSV_HELPER = {
  PAGE_NUMBER_SCAN: 1,
  DETAIL_BATCH_SIZE: 6,
  getFeedsFromPage: (
    document: any,
    ecoSystem: IEcoSystemType
  ): Array<IVulnerabilityType> => {
    let advisories: Array<IVulnerabilityType> = [];

    document
      .querySelectorAll(".vuln-table-row")
      .forEach((tr: any, i: number) => {
        if (i === 0) {
          return;
        }

        let data: IVulnerabilityType = {
          id: "",
          packageName: "",
          version: "",
          severity: SEVERITY_TYPE.CRITICAL as ISecerityType,
          affectedVersions: [],
          source: "OSV",
          publishedDate: "",
          ecosystem: ecoSystem
        };

        const tds = tr.querySelectorAll(".vuln-table-cell");

        const idTd = tds[0];
        const link = idTd.querySelector("a");
        if (link) {
          data.id = link.textContent?.trim();

          if (data.id?.indexOf("MAL-") > -1) {
            data.type = VULNERABILITY_TYPE.MALWARE;
          }

          data.detailURL = link.href;
        }

        const packagesTd = tds[1];
        if (packagesTd) {
          const packages = packagesTd.querySelector(".packages");
          if (packages) {
            const lis = packages.querySelectorAll("li");
            if (lis) {
              lis.forEach((li: any) => {
                data.affectedVersions = [
                  ...(data.affectedVersions ?? []),
                  li.textContent?.trim().replace("npm/", "")
                ];

                data.packageName = (data.affectedVersions || [])
                  .filter(Boolean)
                  .join(", ");
              });
            }
          }
        }

        const summaryTd = tds[2];
        if (summaryTd) {
          data.summary = summaryTd.textContent?.replace(" (npm)", "").trim();
        }

        const publishedTd = tds[3];
        if (publishedTd) {
          data.publishedRelative = publishedTd.textContent?.trim();
          data.publishedDate = publishedTd
            .querySelector("relative-time")
            .getAttribute("datetime");
        }

        const attributesTd = tds[4];
        if (attributesTd) {
          const tags = attributesTd.querySelector(".tags");
          if (tags) {
            const lis = tags.querySelectorAll("li");
            if (lis) {
              lis.forEach((li: any) => {
                const sevText = li.textContent?.trim();
                if (sevText.indexOf("Severity -") > -1) {
                  const sevValue = sevText.split("Severity -")[1]?.trim();
                  if (sevValue) {
                    const scoreAndSeverity = sevValue.split(" ");
                    if (scoreAndSeverity.length === 2) {
                      data.score = scoreAndSeverity[0].trim();

                      const sevLabel = scoreAndSeverity[1]
                        ?.replace("(", "")
                        .replace(")", "")
                        .replace("No fix available", SEVERITY_TYPE.CRITICAL)
                        .replace("Fix available", SEVERITY_TYPE.LOW)
                        .replace("Medium", SEVERITY_TYPE.MEDIUM)
                        .toUpperCase()
                        .trim();

                      data.severity = sevLabel;
                    }
                  }
                } else {
                  data.severity = sevText
                    .replace("No fix available", SEVERITY_TYPE.CRITICAL)
                    .replace("Fix available", SEVERITY_TYPE.LOW);
                }
              });
            }
          }
        }

        advisories = [...advisories, { ...data }];
      });

    return [...advisories];
  },
  getVulnerabilityDetail: async (feedList: Array<IVulnerabilityType>) => {
    const urls = feedList.map(
      (feed: IVulnerabilityType) => `https://api.osv.dev/v1/vulns/${feed.id}`
    );

    for (let i = 0; i < urls.length; i += OSV_HELPER.DETAIL_BATCH_SIZE) {
      const batch = urls.slice(i, i + OSV_HELPER.DETAIL_BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (url) => await fetch(url).then((res) => res.json()))
      );

      if (results && Array.isArray(results) && results.length > 0) {
        results.map(async (res: any) => {
          const selectedFeedIndex = feedList.findIndex(
            (feed: IVulnerabilityType) => feed.id === res.id
          );

          if (selectedFeedIndex > -1) {
            const selectedFeed = feedList[selectedFeedIndex];
            const { modified, affected, database_specific, aliases } = res;
            selectedFeed.modifiedDate = modified;

            if (database_specific) {
              const severity = database_specific["severity"];
              if (severity) {
                selectedFeed.severity = severity;
              }

              const packageOrigin =
                database_specific["malicious-packages-origins"];
              if (packageOrigin && Array.isArray(packageOrigin)) {
                const sha256 = packageOrigin.map((po: any) => po.sha256);
                if (sha256.length > 0) {
                  selectedFeed.sha256 = sha256.join(", ");
                }
              }
            }
            selectedFeed.aliases = aliases;
            selectedFeed.detailURL = `https://osv.dev/vulnerability/${selectedFeed.id}`;

            if (affected && affected.length > 0) {
              let affectedVersions: Array<string> = [];
              affected.forEach((aff: any) => {
                if (aff) {
                  const { ranges, versions, package: pkg } = aff;
                  if (ranges) {
                    affectedVersions.push(
                      ...ranges.flatMap((range: any) =>
                        range.events
                          .map((ev: any) =>
                            ev.introduced
                              ? selectedFeed.packageName === pkg.name
                                ? `>=${ev.introduced}`
                                : `${pkg.name}@>=${ev.introduced}`
                              : ev.fixed
                                ? selectedFeed.packageName === pkg.name
                                  ? `<${ev.fixed}`
                                  : `${pkg.name}@<${ev.fixed}`
                                : ""
                          )
                          .filter(Boolean)
                      )
                    );
                  } else {
                    affectedVersions.push(...versions);
                  }
                }
              });

              selectedFeed.affectedVersions = affectedVersions;
            }

            feedList[selectedFeedIndex] = selectedFeed;
          }
        });
      }
    }
    return [...feedList];
  },
  apiHeaders: () => {
    const myHeaders = new Headers();
    myHeaders.append("turbo-frame", "vulnerability-table-page");

    return {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };
  }
};

const SNYK_HELPER = {
  DETAIL_BATCH_SIZE: 6,
  getFeedsFromPage: (
    document: any,
    ecoSystem: IEcoSystemType
  ): Array<IVulnerabilityType> => {
    let advisories: Array<IVulnerabilityType> = [];

    const table = document.querySelector(".vulns-table");
    if (!table) {
      return advisories;
    }

    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((tr: any) => {
      const tds = tr.querySelectorAll("td");
      if (tds.length < 4) {
        return;
      }

      let data: IVulnerabilityType = {
        id: "",
        packageName: "",
        version: "",
        severity: SEVERITY_TYPE.CRITICAL as ISecerityType,
        affectedVersions: [],
        source: "Synk",
        publishedDate: "",
        ecosystem: ecoSystem
      };

      // First td: VULNERABILITY column with link
      const vulnerabilityTd = tds[0];
      const link = vulnerabilityTd.querySelector("a");
      if (link) {
        const href = link.getAttribute("href");
        if (href) {
          // Extract vulnerability ID from href like /vuln/SNYK-JS-INTEGRATORFILESCRYPT2025-14038379
          const vulnIdMatch = href.match(/\/vuln\/(.+)/);
          if (vulnIdMatch) {
            data.id = vulnIdMatch[1];
            data.detailURL = `https://security.snyk.io${href}`;
          }
        }

        // Check if it's a malicious package (usually indicated by "Malicious Package" text)
        const linkText = link.textContent?.trim() || "";

        // Extract overview/description
        data.summary = linkText;
        data.description = linkText;

        if (linkText.toLowerCase().includes("malicious")) {
          data.type = VULNERABILITY_TYPE.MALWARE;
        }
      }

      // Second td: AFFECTS column with package name
      const affectsTd = tds[1];
      if (affectsTd) {
        const packageLink = affectsTd.querySelector("a");
        if (packageLink) {
          const packageText = packageLink.textContent?.trim();
          if (packageText) {
            // Handle package names like "react-svg-module*" or "@grumpycoffeecup/hello-npm-world*"
            const packageName = packageText.replace(/\*$/, "").trim();
            data.packageName = packageName;
          }
        } else {
          // Fallback to text content
          const packageText = affectsTd.textContent?.trim();
          if (packageText) {
            const packageName = packageText.replace(/\*$/, "").trim();
            data.packageName = packageName;
          }
        }

        const affectedVersions = affectsTd.querySelector(
          ".vulns-table__semver"
        );
        if (affectedVersions) {
          data.affectedVersions = affectedVersions;
        }
      }

      // Fourth td: PUBLISHED column with date
      const publishedTd = tds[3];
      if (publishedTd) {
        const publishedText = publishedTd.textContent?.trim();
        data.publishedRelative = publishedText;
        // Try to extract date if available
        const timeElement = publishedTd.querySelector("time");
        if (timeElement) {
          data.publishedDate =
            timeElement.getAttribute("datetime") || publishedText;
        } else {
          // Try to parse date from text
          try {
            const date = new Date(publishedText);
            if (!isNaN(date.getTime())) {
              data.publishedDate = date.toISOString();
            }
          } catch (e) {
            // Keep publishedRelative as fallback
            data.publishedDate = publishedText;
          }
        }
      }

      if (data.id) {
        advisories = [...advisories, { ...data }];
      }
    });

    return advisories;
  },
  getVulnerabilityDetail: async (feedList: Array<IVulnerabilityType>) => {
    const urls = feedList.map((feed: IVulnerabilityType) => {
      if (feed.detailURL) {
        return feed.detailURL;
      }
      return `https://security.snyk.io/vuln/${feed.id}`;
    });

    for (let i = 0; i < urls.length; i += SNYK_HELPER.DETAIL_BATCH_SIZE) {
      const batch = urls.slice(i, i + SNYK_HELPER.DETAIL_BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (url) => {
          try {
            const doc = await fetchHTMLDocument(url);
            return doc;
          } catch (err) {
            console.error(`Failed to fetch detail for ${url}:`, err);
            return null;
          }
        })
      );

      results.forEach((doc: any, index: number) => {
        if (!doc) {
          return;
        }

        const feedIndex = i + index;
        if (feedIndex >= feedList.length) {
          return;
        }

        const selectedFeed = feedList[feedIndex];

        // Extract severity and score using DOM methods
        const severitySection = doc.querySelector(
          '[class*="severity"], [data-severity]'
        );
        if (severitySection) {
          // Look for score element
          const scoreElement = severitySection.querySelector(
            '[class*="score"], [data-score], strong, b'
          );
          if (scoreElement) {
            const scoreText = scoreElement.textContent?.trim() || "";
            const scoreValue = parseFloat(scoreText);
            if (!isNaN(scoreValue)) {
              selectedFeed.score = scoreText;
              selectedFeed.cvssScore = scoreValue;
            }
          }

          // Look for severity level
          const severityLevelElement = severitySection.querySelector(
            '[class*="level"], [data-severity-level], span, div'
          );
          if (severityLevelElement) {
            const severityText =
              severityLevelElement.textContent?.trim().toUpperCase() || "";
            if (severityText.includes("CRITICAL")) {
              selectedFeed.severity = SEVERITY_TYPE.CRITICAL as ISecerityType;
            } else if (severityText.includes("HIGH")) {
              selectedFeed.severity = SEVERITY_TYPE.HIGH as ISecerityType;
            } else if (severityText.includes("MEDIUM")) {
              selectedFeed.severity = SEVERITY_TYPE.MEDIUM as ISecerityType;
            } else if (severityText.includes("LOW")) {
              selectedFeed.severity = SEVERITY_TYPE.LOW as ISecerityType;
            }
          }
        }

        // Fallback: Check for severity in headings or strong elements
        if (!selectedFeed.severity) {
          const severityHeadings = doc.querySelectorAll(
            'h1, h2, [class*="severity"]'
          );
          severityHeadings.forEach((el: any) => {
            const text = el.textContent?.trim().toUpperCase() || "";
            if (text.includes("CRITICAL") && !selectedFeed.severity) {
              selectedFeed.severity = SEVERITY_TYPE.CRITICAL as ISecerityType;
            } else if (text.includes("HIGH") && !selectedFeed.severity) {
              selectedFeed.severity = SEVERITY_TYPE.HIGH as ISecerityType;
            } else if (text.includes("MEDIUM") && !selectedFeed.severity) {
              selectedFeed.severity = SEVERITY_TYPE.MEDIUM as ISecerityType;
            } else if (text.includes("LOW") && !selectedFeed.severity) {
              selectedFeed.severity = SEVERITY_TYPE.LOW as ISecerityType;
            }
          });
        }

        // Extract CVSS scores (version 4.0 and 3.1) using DOM methods
        let cvssData: any = {};

        // Look for CVSS version 4.0 section
        const cvssV4Section = doc.querySelector(
          '[class*="cvss"][class*="4"], [data-cvss-version="4"], [data-cvss="4"]'
        );
        if (cvssV4Section) {
          const scoreElement = cvssV4Section.querySelector(
            '[class*="score"], [data-score]'
          );
          if (scoreElement) {
            const scoreText = scoreElement.textContent?.trim() || "";
            const scoreValue = parseFloat(scoreText);
            if (!isNaN(scoreValue)) {
              const severityElement = cvssV4Section.querySelector(
                '[class*="severity"], [data-severity]'
              );
              const severityText =
                severityElement?.textContent?.trim().toUpperCase() || "";
              cvssData.cvss_v4 = {
                score: scoreValue,
                severity: severityText
              };
            }
          }
        }

        // Look for CVSS version 3.1 section
        const cvssV3Section = doc.querySelector(
          '[class*="cvss"][class*="3"], [data-cvss-version="3"], [data-cvss="3"]'
        );
        if (cvssV3Section) {
          const scoreElement = cvssV3Section.querySelector(
            '[class*="score"], [data-score]'
          );
          if (scoreElement) {
            const scoreText = scoreElement.textContent?.trim() || "";
            const scoreValue = parseFloat(scoreText);
            if (!isNaN(scoreValue)) {
              const severityElement = cvssV3Section.querySelector(
                '[class*="severity"], [data-severity]'
              );
              const severityText =
                severityElement?.textContent?.trim().toUpperCase() || "";
              cvssData.cvss_v3 = {
                score: scoreValue,
                severity: severityText
              };
            }
          }
        }

        if (Object.keys(cvssData).length > 0) {
          selectedFeed.cvss_severities = cvssData;
          // Use CVSS v4 score if available, otherwise v3
          if (cvssData.cvss_v4) {
            selectedFeed.score = cvssData.cvss_v4.score.toString();
            selectedFeed.cvssScore = cvssData.cvss_v4.score;
          } else if (cvssData.cvss_v3) {
            selectedFeed.score = cvssData.cvss_v3.score.toString();
            selectedFeed.cvssScore = cvssData.cvss_v3.score;
          }
        }

        // Extract CVSS vector details from .vendorcvss__container using DOM methods
        const vectorData: any = {};
        const cvssContainer = doc.querySelector(".vendorcvss__container");

        if (cvssContainer) {
          const vectorLabels = [
            { label: "Attack Vector", abbrev: "AV", key: "av" },
            { label: "Attack Complexity", abbrev: "AC", key: "ac" },
            { label: "Attack Requirements", abbrev: "AT", key: "at" },
            { label: "Privileges Required", abbrev: "PR", key: "pr" },
            { label: "User Interaction", abbrev: "UI", key: "ui" },
            { label: "Confidentiality", abbrev: "VC", key: "vc" },
            { label: "Integrity", abbrev: "VI", key: "vi" },
            { label: "Availability", abbrev: "VA", key: "va" },
            { label: "Confidentiality", abbrev: "SC", key: "sc" },
            { label: "Integrity", abbrev: "SI", key: "si" },
            { label: "Availability", abbrev: "SA", key: "sa" }
          ];

          vectorLabels.forEach(({ label, abbrev, key }) => {
            // Look for elements containing the label
            const labelElements = cvssContainer.querySelectorAll(
              "dt, div, span, li, td, dd"
            );
            labelElements.forEach((el: any) => {
              const text = el.textContent?.trim() || "";
              if (text.includes(label) || text.includes(`(${abbrev})`)) {
                // Check for value in bold/strong within the same element
                const boldValue = el.querySelector("strong, b");
                if (boldValue && !vectorData[key]) {
                  const value = boldValue.textContent?.trim();
                  if (value && value.length < 100) {
                    vectorData[key] = value;
                    return;
                  }
                }

                // Check next sibling for value
                const nextSibling = el.nextElementSibling;
                if (nextSibling && !vectorData[key]) {
                  const siblingText = nextSibling.textContent?.trim();
                  // Check if sibling has bold text
                  const siblingBold = nextSibling.querySelector("strong, b");
                  const value = siblingBold
                    ? siblingBold.textContent?.trim()
                    : siblingText;

                  if (value && value.length < 100) {
                    // Verify it's not another label
                    const isLabel = vectorLabels.some(
                      ({ label: l }) => value.includes(l) && value.length < 200
                    );
                    if (!isLabel) {
                      vectorData[key] = value;
                      return;
                    }
                  }
                }

                // Check for data attributes
                const dataValue =
                  el.getAttribute(`data-${key}`) ||
                  el.getAttribute(`data-${abbrev.toLowerCase()}`);
                if (dataValue && !vectorData[key]) {
                  vectorData[key] = dataValue.trim();
                  return;
                }
              }
            });

            // Also check for elements with specific data attributes
            const dataElement = cvssContainer.querySelector(
              `[data-${key}], [data-${abbrev.toLowerCase()}]`
            );
            if (dataElement && !vectorData[key]) {
              const value =
                dataElement.getAttribute(`data-${key}`) ||
                dataElement.getAttribute(`data-${abbrev.toLowerCase()}`) ||
                dataElement.textContent?.trim();
              if (value && value.length < 100) {
                vectorData[key] = value;
              }
            }
          });
        }

        if (Object.keys(vectorData).length > 0) {
          selectedFeed.score_vector = JSON.stringify(vectorData);
          if (!selectedFeed.cvss) {
            selectedFeed.cvss = {};
          }
          selectedFeed.cvss.vector = vectorData;
        }

        // Extract published and disclosed dates using DOM methods
        // Look for published date
        const publishedElements = doc.querySelectorAll(
          '[class*="published"], [data-published], dt, dd, li'
        );
        publishedElements.forEach((el: any) => {
          const text = el.textContent?.toLowerCase() || "";
          if (text.includes("published") && !selectedFeed.publishedDate) {
            // Check for time element with datetime
            const timeEl = el.querySelector("time[datetime]");
            if (timeEl) {
              const datetime = timeEl.getAttribute("datetime");
              if (datetime) {
                try {
                  const date = new Date(datetime);
                  if (!isNaN(date.getTime())) {
                    selectedFeed.publishedDate = date.toISOString();
                  }
                } catch (e) {
                  // Keep original if parsing fails
                }
              }
            } else {
              // Check next sibling
              const nextSibling = el.nextElementSibling;
              if (nextSibling) {
                const timeEl = nextSibling.querySelector("time[datetime]");
                if (timeEl) {
                  const datetime = timeEl.getAttribute("datetime");
                  if (datetime) {
                    try {
                      const date = new Date(datetime);
                      if (!isNaN(date.getTime())) {
                        selectedFeed.publishedDate = date.toISOString();
                      }
                    } catch (e) {
                      // Keep original if parsing fails
                    }
                  }
                }
              }
            }
          }
        });

        // Look for disclosed date
        const disclosedElements = doc.querySelectorAll(
          '[class*="disclosed"], [data-disclosed], dt, dd, li'
        );
        disclosedElements.forEach((el: any) => {
          const text = el.textContent?.toLowerCase() || "";
          if (text.includes("disclosed") && !selectedFeed.modifiedDate) {
            // Check for time element with datetime
            const timeEl = el.querySelector("time[datetime]");
            if (timeEl) {
              const datetime = timeEl.getAttribute("datetime");
              if (datetime) {
                try {
                  const date = new Date(datetime);
                  if (!isNaN(date.getTime())) {
                    selectedFeed.modifiedDate = date.toISOString();
                  }
                } catch (e) {
                  // Keep original if parsing fails
                }
              }
            } else {
              // Check next sibling
              const nextSibling = el.nextElementSibling;
              if (nextSibling) {
                const timeEl = nextSibling.querySelector("time[datetime]");
                if (timeEl) {
                  const datetime = timeEl.getAttribute("datetime");
                  if (datetime) {
                    try {
                      const date = new Date(datetime);
                      if (!isNaN(date.getTime())) {
                        selectedFeed.modifiedDate = date.toISOString();
                      }
                    } catch (e) {
                      // Keep original if parsing fails
                    }
                  }
                }
              }
            }
          }
        });

        // Fallback: Look for all time elements with datetime attribute
        if (!selectedFeed.publishedDate || !selectedFeed.modifiedDate) {
          const timeElements = doc.querySelectorAll("time[datetime]");
          timeElements.forEach((timeEl: any) => {
            const datetime = timeEl.getAttribute("datetime");
            if (datetime) {
              const parentText =
                timeEl.parentElement?.textContent?.toLowerCase() || "";
              if (
                parentText.includes("published") &&
                !selectedFeed.publishedDate
              ) {
                try {
                  const date = new Date(datetime);
                  if (!isNaN(date.getTime())) {
                    selectedFeed.publishedDate = date.toISOString();
                  }
                } catch (e) {
                  // Keep original if parsing fails
                }
              }
              if (
                parentText.includes("disclosed") &&
                !selectedFeed.modifiedDate
              ) {
                try {
                  const date = new Date(datetime);
                  if (!isNaN(date.getTime())) {
                    selectedFeed.modifiedDate = date.toISOString();
                  }
                } catch (e) {
                  // Keep original if parsing fails
                }
              }
            }
          });
        }

        // Extract CWE information using DOM methods
        const cweLinks = doc.querySelectorAll('a[href*="cwe"], [class*="cwe"]');
        cweLinks.forEach((el: any) => {
          const href = el.getAttribute("href") || "";
          const text = el.textContent?.trim() || "";

          // Extract CWE ID from href or text
          let cweId = "";
          if (href.includes("cwe")) {
            const hrefMatch = href.match(/cwe[\/-]?(\d+)/i);
            if (hrefMatch) {
              cweId = `CWE-${hrefMatch[1]}`;
            }
          }

          // Fallback: extract from text content
          if (!cweId && text.includes("CWE-")) {
            const textParts = text.split("CWE-");
            if (textParts.length > 1) {
              const cweNum = textParts[1].split(/\s|\)|\(/)[0];
              if (cweNum && /^\d+$/.test(cweNum)) {
                cweId = `CWE-${cweNum}`;
              }
            }
          }

          if (cweId) {
            if (!selectedFeed.weaknesses) {
              selectedFeed.weaknesses = [];
            }
            // Check if already added
            const exists = selectedFeed.weaknesses.some(
              (w: any) => w.id === cweId
            );
            if (!exists) {
              const cleanName = text.replace("(opens in a new tab)", "").trim();
              selectedFeed.weaknesses.push({
                id: cweId,
                name: cleanName || cweId
              });
            }
          }
        });

        // Extract CVE ID using DOM methods
        const cveLinks = doc.querySelectorAll('a[href*="cve"], [class*="cve"]');
        cveLinks.forEach((el: any) => {
          const href = el.getAttribute("href") || "";
          const text = el.textContent?.trim() || "";

          // Extract CVE ID from href
          if (href.includes("cve")) {
            const hrefMatch = href.match(/CVE-\d{4}-\d+/i);
            if (hrefMatch && !selectedFeed.cve_id) {
              selectedFeed.cve_id = hrefMatch[0];
              selectedFeed.cveId = hrefMatch[0];
            }
          }

          // Fallback: extract from text content
          if (!selectedFeed.cve_id && text.includes("CVE-")) {
            const textMatch = text.match(/CVE-\d{4}-\d+/i);
            if (textMatch) {
              selectedFeed.cve_id = textMatch[0];
              selectedFeed.cveId = textMatch[0];
            }
          }
        });

        // Extract references
        const referenceSection = doc.querySelector(
          '[class*="reference"], section'
        );
        if (referenceSection) {
          const referenceLinks = referenceSection.querySelectorAll("a[href]");
          const references: string[] = [];
          referenceLinks.forEach((link: any) => {
            const href = link.getAttribute("href");
            if (href && (href.startsWith("http") || href.startsWith("//"))) {
              references.push(href);
            }
          });
          if (references.length > 0) {
            selectedFeed.references = references;
          }
        }

        // Extract affected versions from .vuln-versions element
        const vulnVersionsElement = doc.querySelector(".vuln-versions");
        if (vulnVersionsElement) {
          // Get text content from the element
          const versionsText = vulnVersionsElement.textContent?.trim() || "";

          // Try to extract version ranges or individual versions
          // Pattern 1: Look for version ranges like ">=1.0.0 <2.0.0" or "1.0.0 - 2.0.0"
          const versionRangePattern =
            /(?:>=|<=|>|<)?\s*[\d.]+(?:\s*[-<>=]+\s*[\d.]+)?/g;
          const versionRanges = versionsText.match(versionRangePattern);

          if (versionRanges && versionRanges.length > 0) {
            selectedFeed.affectedVersions = versionRanges
              .map((v: string) => v.trim())
              .filter(Boolean);
          } else {
            // Pattern 2: Look for versions in bold or specific format
            const boldVersions = vulnVersionsElement.querySelectorAll(
              'strong, b, [class*="version"]'
            );
            if (boldVersions.length > 0) {
              const versions: string[] = [];
              boldVersions.forEach((el: any) => {
                const versionText = el.textContent?.trim();
                if (versionText && !versions.includes(versionText)) {
                  versions.push(versionText);
                }
              });
              if (versions.length > 0) {
                selectedFeed.affectedVersions = versions;
              }
            } else {
              // Pattern 3: Split by common delimiters and clean up
              const cleanedText = versionsText.replace(/\*\*/g, "").trim();
              if (cleanedText) {
                // Split by common delimiters: comma, semicolon, newline, or "and"
                const versions = cleanedText
                  .split(/[,;\n]|and|&/)
                  .map((v: string) => v.trim())
                  .filter((v: string) => v.length > 0 && v !== "*");

                if (versions.length > 0) {
                  selectedFeed.affectedVersions = versions;
                } else {
                  // If no splitting worked, use the whole text if it looks like a version
                  if (cleanedText.match(/[\d.]+/) || cleanedText === "*") {
                    selectedFeed.affectedVersions = [cleanedText];
                  }
                }
              }
            }
          }

          // Also check for data attributes or specific child elements
          const versionAttr =
            vulnVersionsElement.getAttribute("data-versions") ||
            vulnVersionsElement.getAttribute("data-affected-versions");
          if (versionAttr) {
            try {
              const parsedVersions = JSON.parse(versionAttr);
              if (Array.isArray(parsedVersions)) {
                selectedFeed.affectedVersions = parsedVersions;
              }
            } catch (e) {
              // If not JSON, treat as comma-separated
              const versions = versionAttr
                .split(",")
                .map((v: string) => v.trim())
                .filter(Boolean);
              if (versions.length > 0) {
                selectedFeed.affectedVersions = versions;
              }
            }
          }
        }

        feedList[feedIndex] = selectedFeed;
      });
    }

    return [...feedList];
  },
  apiHeaders: () => {
    return {
      method: "GET",
      redirect: "follow"
    };
  }
};

const fetchHTMLDocument = async (url: string, apiHeaders: any = {}) => {
  const res = await fetch(url, apiHeaders);

  if (!res.ok) {
    return null;
  }

  const html = await res.text();

  const { parseHTML } = await import("linkedom");
  const { document } = parseHTML(html);

  return document;
};

const fetchParallel = async (urls: Array<string>, apiHeaders?: any) => {
  const promises = urls.map((url) => fetchHTMLDocument(url, apiHeaders));
  const results = await Promise.all(promises);
  return results;
};

export const isWithinDays = (dateString: string, daysInWithIn: number = 10) => {
  const inputDate = new Date(dateString);
  const now = new Date();

  // 10 days ago timestamp
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(now.getDate() - daysInWithIn);

  return inputDate >= tenDaysAgo; // true if within last 10 days
};

const fetchOSV = async (
  filterData: ILatestQueryFilterType,
  publishDuration: number,
  existingResult: Array<IVulnerabilityType>
) => {
  let { ecosystem = "NPM" } = filterData;

  let urls: Array<string> = [];

  const apiHeaders = OSV_HELPER.apiHeaders();
  for (let page = 1; page <= OSV_HELPER.PAGE_NUMBER_SCAN; page++) {
    urls.push(
      `https://osv.dev/list?page=${page}&ecosystem=${ecosystem.toLocaleLowerCase()}`
    );
  }

  const results = await fetchParallel(urls, apiHeaders);

  let feedList: Array<IVulnerabilityType> = [];
  results.forEach((result: any) => {
    feedList = [...feedList, ...OSV_HELPER.getFeedsFromPage(result, ecosystem)];
  });

  feedList = feedList.filter(
    (f: IVulnerabilityType) =>
      f.publishedDate && isWithinDays(f.publishedDate, publishDuration)
  );

  const existingIds = existingResult.map((ex: IVulnerabilityType) => ex.id);
  let diffVul = feedList.filter(
    (feed: IVulnerabilityType) => !existingIds.includes(feed.id)
  );

  diffVul = await OSV_HELPER.getVulnerabilityDetail(diffVul);

  return diffVul;
};

const fetchSnyk = async (
  filterData: ILatestQueryFilterType,
  publishDuration: number,
  existingResult: Array<IVulnerabilityType>
) => {
  let { ecosystem = "NPM" } = filterData;

  // Only fetch for npm ecosystem from Snyk
  if (ecosystem.toLocaleLowerCase() !== "npm") {
    return [];
  }

  // Fetch both pages in parallel
  const urls: Array<string> = [
    `https://security.snyk.io/vuln/${ecosystem.toLocaleLowerCase()}`,
    `https://security.snyk.io/vuln/${ecosystem.toLocaleLowerCase()}/2`
  ];

  const apiHeaders = SNYK_HELPER.apiHeaders();
  const results = await fetchParallel(urls, apiHeaders);

  let feedList: Array<IVulnerabilityType> = [];
  results.forEach((result: any) => {
    if (result) {
      feedList = [
        ...feedList,
        ...SNYK_HELPER.getFeedsFromPage(result, ecosystem)
      ];
    }
  });

  // Filter by date if publishedDate is available
  feedList = feedList.filter((f: IVulnerabilityType) => {
    if (!f.publishedDate) {
      return true; // Include if no date available
    }
    return isWithinDays(f.publishedDate, publishDuration);
  });

  // Remove duplicates with existing results
  const existingIds = existingResult.map((ex: IVulnerabilityType) => ex.id);
  let diffVul = feedList.filter(
    (feed: IVulnerabilityType) => !existingIds.includes(feed.id)
  );

  // Fetch details from individual vulnerability pages
  diffVul = await SNYK_HELPER.getVulnerabilityDetail(diffVul);

  return diffVul;
};

const deduplicate = (results: any[]) => {
  const seen = new Set();
  return results.filter((r) => {
    const key = r.id || r.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const fetchRSSFeeds = async (filterData: {
  duration: "month" | "today" | "week";
  ecosystem: IEcoSystemType;
  apiKey: string;
}) => {
  const { duration } = filterData;
  let publishDuration = 7;

  switch (duration) {
    case "month":
      publishDuration = 30;
      break;

    case "today":
      publishDuration = 1;
      break;
  }

  try {
    const ghsaPromise = GHSA_HELPER.fetchGithubAdvisories(
      publishDuration,
      filterData
    );

    const [ghsa] = await Promise.allSettled([ghsaPromise]);

    let allResults = [...(ghsa.status === "fulfilled" ? ghsa.value : [])];

    const osvResults = await fetchOSV(filterData, publishDuration, allResults);

    allResults = [...allResults, ...osvResults];

    const snykResults = await fetchSnyk(
      filterData,
      publishDuration,
      allResults
    );

    allResults = [...allResults, ...snykResults];

    const merged: Array<IVulnerabilityType> = deduplicate(allResults);

    return {
      fetchedAt: new Date().toISOString(),
      count: merged.length,
      advisories: merged,
      duration
    };
  } catch (err: any) {
    return {
      error: err.message,
      fetchedAt: new Date().toISOString(),
      count: -1,
      advisories: []
    };
  }
};
