import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { InterviewService } from "@/services/interviews.service";
import { logger } from "@/lib/logger";

const base_url = process.env.NEXT_PUBLIC_LIVE_URL;

export async function POST(req: Request, res: Response) {
  try {
    const url_id = nanoid();
    const url = `${base_url}/call/${url_id}`;
    const body = await req.json();

    logger.info("create-interview request received");
    console.log("Request body:", body);

    const payload = body.interviewData;
    console.log("Interview payload:", payload);

    let readableSlug = null;
    if (body.organizationName) {
      const interviewNameSlug = payload.name?.toLowerCase().replace(/\s/g, "-");
      const orgNameSlug = body.organizationName
        ?.toLowerCase()
        .replace(/\s/g, "-");
      readableSlug = `${orgNameSlug}-${interviewNameSlug}`;
    }

    const finalPayload = {
      ...payload,
      url: url,
      id: url_id,
      readable_slug: readableSlug,
    };

    console.log("Final payload being sent to database:", finalPayload);

    const newInterview = await InterviewService.createInterview(finalPayload);

    logger.info("Interview created successfully");

    return NextResponse.json(
      { response: "Interview created successfully" },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error creating interview:", err);
    
    // More detailed error logging
    if (err && typeof err === 'object') {
      console.error("Error details:", JSON.stringify(err, null, 2));
    }
    
    logger.error("Error creating interview");

    let errorMessage = "Internal server error";
    let errorDetails = "Unknown error";

    if (err instanceof Error) {
      errorMessage = err.message;
      errorDetails = err.message;
    } else if (err && typeof err === 'object' && 'message' in err) {
      errorMessage = (err as any).message;
      errorDetails = JSON.stringify(err);
    } else {
      errorDetails = String(err);
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        type: err?.constructor?.name || typeof err
      },
      { status: 500 },
    );
  }
}
