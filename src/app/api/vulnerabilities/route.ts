import { findVulnerabilitiesInPackage } from "@/lib/scanner";
import fs from "fs";

import { clearVulnerabilityActionData } from "@/app/actions/vulnerabilities.action";
import { IRecord } from "@/types/vulnerability";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { VulnerabilityService } from "../../../lib/vulnerabilityService";

// Cache configuration
const CACHE_DURATION = 300; // 5 minutes in seconds
const CACHE_TAGS = ["vulnerabilities"];

export async function GET(request: NextRequest) {
  try {
    const vulnerabilityService = VulnerabilityService.getInstance();
    const result = await vulnerabilityService.getVulnerabilities();

    const response = NextResponse.json(result);

    // Set cache headers
    response.headers.set(
      "Cache-Control",
      `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`
    );
    response.headers.set("CDN-Cache-Control", `max-age=${CACHE_DURATION}`);
    // response.headers.set(
    //   "Vercel-CDN-Cache-Control",
    //   `max-age=${CACHE_DURATION}`
    // );
    // response.headers.set("Vercel-Cache-Tags", CACHE_TAGS.join(","));

    // // Add ETag for conditional requests
    // const etag = `"${Buffer.from(JSON.stringify(result)).toString("base64")}"`;
    // response.headers.set("ETag", etag);

    // Check if client has cached version
    // const ifNoneMatch = request.headers.get("if-none-match");
    // if (ifNoneMatch === etag) {
    //   return new NextResponse(null, { status: 304 });
    // }

    return response;
  } catch (error) {
    console.error("Error fetching vulnerabilities:", error);

    // Return cached error response if available
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch vulnerabilities" },
      { status: 500 }
    );

    // Cache error responses for shorter duration
    errorResponse.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=30"
    );

    return errorResponse;
  }
}

const fetchLatest = async (request: NextRequest, body: Record<string, any>) => {
  const { duration = "week", ecosystem = "npm", apiKey } = body;

  if (!apiKey || apiKey !== process.env.NEXT_PUBLIC_VUL_API_KEY) {
    return new NextResponse("Unauthorized. API key is required", {
      status: 403
    });
  }

  clearVulnerabilityActionData();

  const vulnerabilityService = VulnerabilityService.getInstance();

  const result = await vulnerabilityService.getLatestVulnerabilities(
    duration,
    ecosystem,
    apiKey
  );

  return result;
};

const analysePackageFile = async (
  request: NextRequest,
  body: Record<string, any>
) => {
  const { packageFileContent } = body;

  if (!packageFileContent) {
    return new NextResponse("Missing/Incorrect package file uploaded", {
      status: 402
    });
  }

  const vulList = await findVulnerabilitiesInPackage(packageFileContent);

  // try {
  //   const fileName = `${packageFileContent.name}.json`;
  //   // Create a path in server
  //   const filePath = path.join(
  //     process.cwd(),
  //     "/tmp/submitted_packages",
  //     fileName
  //   );

  //   // Ensure folder exists
  //   fs.mkdirSync(path.dirname(filePath), { recursive: true });

  //   // Write content to file
  //   fs.writeFileSync(
  //     filePath,
  //     JSON.stringify(JSON.stringify(packageFileContent)),
  //     "utf-8"
  //   );
  // } catch (e) {
  //   console.log("Submitted file not created");
  // }

  return {
    ecosystem: packageFileContent.ecosystem,
    projectName: packageFileContent.name,
    projectVersion: packageFileContent.version,
    vulnerabilities: vulList
  };
};

const getSubmittedPackageVulnerabilities = async () => {
  try {
    const folderPath = path.join(process.cwd(), "/tmp/submitted_packages");

    const files = fs.readdirSync(folderPath);
    if (files.length === 0) {
      return [];
    }

    let listOfMatched: Array<IRecord> = [];
    const vulnerabilityService = VulnerabilityService.getInstance();

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      let content: any = fs.readFileSync(filePath, "utf8");

      if (content) {
        content = content.replace(/^\uFEFF/, "").trim();
        const JSONContent = JSON.parse(JSON.parse(content));
        const { name, version, ecosystem, packages } = JSONContent;

        const matchedVuls =
          vulnerabilityService.returnVulnerabilitiesForPackages(packages);

        if (matchedVuls.length > 0) {
          listOfMatched = [
            ...listOfMatched,
            {
              name,
              version,
              ecosystem,
              matchedVuls
            }
          ];
        }
      }
    });
    return listOfMatched;
  } catch (e) {
    console.log("file reading failed");
    return [];
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = "fetchLatest" } = body;

    let result: any = null;

    switch (action) {
      case "fetchLatest":
        result = await fetchLatest(request, body);
        break;

      case "analysePackageFile":
        result = await analysePackageFile(request, body);
        break;

      case "getSubmittedPackagesVulnerabilities":
        result = await getSubmittedPackageVulnerabilities();
        break;
    }

    revalidateTag("advisories");
    const response = NextResponse.json({
      result,
      revalidated: true,
      now: Date.now()
    });

    // // Set cache headers
    // response.headers.set(
    //   "Cache-Control",
    //   `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`
    // );
    // response.headers.set("CDN-Cache-Control", `max-age=${CACHE_DURATION}`);
    // response.headers.set(
    //   "Vercel-CDN-Cache-Control",
    //   `max-age=${CACHE_DURATION}`
    // );
    // response.headers.set("Vercel-Cache-Tags", CACHE_TAGS.join(","));

    // // Add ETag for conditional requests
    // const etag = `"${Buffer.from(JSON.stringify(result)).toString("base64")}"`;
    // response.headers.set("ETag", etag);

    // // Check if client has cached version
    // const ifNoneMatch = request.headers.get("if-none-match");
    // if (ifNoneMatch === etag) {
    //   return new NextResponse(null, { status: 304 });
    // }

    return response;
  } catch (error) {
    console.error("Error fetching vulnerabilities:", error);

    // Return cached error response if available
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch vulnerabilities" },
      { status: 500 }
    );

    // Cache error responses for shorter duration
    errorResponse.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=30"
    );

    return errorResponse;
  }
}
