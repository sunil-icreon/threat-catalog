import { NextRequest, NextResponse } from "next/server";
import { VulnerabilityService } from "@/lib/vulnerabilityService";

/**
 * Cron endpoint to automatically fetch latest vulnerabilities
 * Runs every 6 hours for all ecosystems with week duration
 * 
 * Security: 
 * - Vercel cron jobs automatically include 'x-vercel-cron' header
 * - Also supports CRON_SECRET in Authorization header or query parameter for external cron services
 */
export async function GET(request: NextRequest) {
  try {
    // Check if this is a Vercel cron request (most secure for Vercel deployments)
    const vercelCronHeader = request.headers.get("x-vercel-cron");
    const isVercelCron = vercelCronHeader === "1";
    
    // Get cron secret from environment
    const cronSecret = process.env.CRON_SECRET;
    
    // Validate request: either Vercel cron OR custom secret
    if (!isVercelCron && cronSecret) {
      const authHeader = request.headers.get("authorization");
      const querySecret = request.nextUrl.searchParams.get("secret");
      
      // Extract secret from Authorization header (supports Bearer or Cron prefix)
      let providedSecret = querySecret;
      if (authHeader) {
        if (authHeader.startsWith("Bearer ")) {
          providedSecret = authHeader.replace("Bearer ", "");
        } else if (authHeader.startsWith("Cron ")) {
          providedSecret = authHeader.replace("Cron ", "");
        } else {
          // If no prefix, use the header value directly
          providedSecret = authHeader;
        }
      }

      if (!providedSecret || providedSecret !== cronSecret) {
        console.warn("Unauthorized cron request - invalid secret");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (!isVercelCron && !cronSecret) {
      // If no Vercel cron header and no secret configured, reject
      console.warn("Unauthorized cron request - no Vercel cron header and no CRON_SECRET configured");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_VUL_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_VUL_API_KEY is not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    console.log("Starting scheduled fetchLatest for all ecosystems...");
    const startTime = Date.now();

    // Call fetchLatest with:
    // - duration: "week"
    // - ecosystem: "" (empty string for all ecosystems)
    // - apiKey: from environment
    const vulnerabilityService = VulnerabilityService.getInstance();
    const result = await vulnerabilityService.getLatestVulnerabilities(
      "week",
      "", // Empty string fetches all ecosystems
      apiKey
    );

    const duration = Date.now() - startTime;
    console.log(`Scheduled fetchLatest completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Successfully fetched latest vulnerabilities for all ecosystems",
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      result: {
        total: result?.total || 0,
        ecosystems: result?.stats?.ecosystem || {}
      }
    });
  } catch (error: any) {
    console.error("Error in scheduled fetchLatest:", error);
    
    // Return error but don't expose internal details
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch latest vulnerabilities",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Also support POST requests for external cron services
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

