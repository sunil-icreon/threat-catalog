import { ILatestQueryFilterType } from "@/app/page";
import { PackageInfo, ProjectInfo } from "@/components/PackageUploader";
import {
  IEcoSystemType,
  ISecerityType,
  IVulnerabilityType,
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
          review_type: vul.type
        }
      ];
    });

    return vulnerabilities;
  },
  fetchGithubAdvisoriesForPackages: async (
    packages: string,
    ecoSystem: string
  ) => {
    // await sleep(1000);
    // return [];

    const apiURL = `https://api.github.com/advisories?ecosystem=${ecoSystem}&affects=${packages}`;

    const res = await fetch(apiURL);

    if (!res.ok) {
      return [];
    }

    const response = await res.json();

    let vulnerabilities: Array<IVulnerabilityType> =
      GHSA_HELPER.vulnerabilityMapper(response, "NPM");

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

export const findVulnerabilitiesInPackage = async (
  projectInfo: ProjectInfo
) => {
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
            const { modified, affected, database_specific, details } = res;
            selectedFeed.modifiedDate = modified;

            // if (details) {
            //   // selectedFeed.detailSummary = details;

            //   if (
            //     details.indexOf(
            //       "\n---\n_-= Per source details. Do not edit below this line"
            //     ) > -1
            //   ) {
            //     const re =
            //       /## Source:\s*ghsa-malware[^\n]*\n([\s\S]*?)(?:\n\s*\n|$)/;
            //     const m = details.match(re);
            //     // selectedFeed.detailSummary = m ? m[1].trim() : details;
            //   }
            // }

            if (affected && affected.length > 0) {
              const affectedVersion = affected[0];

              if (affectedVersion) {
                const { ranges, versions } = affectedVersion;
                if (ranges) {
                  selectedFeed.affectedVersions = ranges;
                } else {
                  selectedFeed.affectedVersions = versions;
                }
              }
            }

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

    const [ghsa] = await Promise.allSettled([
      ghsaPromise
      // fetchNVD(filterData)
      // fetchSnyk(webRenderer)
    ]);

    let allResults = [
      // ...(nvd.status === "fulfilled" ? nvd.value : [])
      // ...(synk.status === "fulfilled" ? synk.value : []),
      ...(ghsa.status === "fulfilled" ? ghsa.value : [])
    ];

    // const osvResults = await fetchOSV(filterData, publishDuration, allResults);

    // allResults = [...allResults, ...osvResults];

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
