import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMunicipalityNotification } from '@/lib/email';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userEmail = session.user.email;
    
    const body = await request.json();
    const { latitude, longitude, imageUrl, severity, confidence, senderEmail, targetEmail } = body;

    // Validate severity constraint
    if (confidence < 0.15) {
      return NextResponse.json(
        { success: false, message: "Confidence too low, rejected as false report." },
        { status: 400 }
      );
    }

    // Resolve address from coordinates via Nominatim API
    let locationName = "Unknown Location";
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        locationName = geoData.display_name || "Unknown Location";
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e);
    }

    // Upsert the user using their email

    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        name: userEmail.split("@")[0]
      }
    });

    const finalTargetEmail = targetEmail || "test-municipality@example.com";
    const finalSenderEmail = senderEmail || userEmail;
    
    const newReport = await prisma.potholeReport.create({
      data: {
        userId: user.id,
        latitude,
        longitude,
        imageUrl,
        severity,
        confidence,
        locationName,
        status: "REPORTED",
        reportCount: 1,
        senderEmail: finalSenderEmail,
        targetEmail: finalTargetEmail
      },
    });

    // Dispatch Email (Passing userEmail as Reply-To)
    sendMunicipalityNotification(
      finalTargetEmail,
      finalSenderEmail,
      newReport.id,
      severity,
      latitude,
      longitude,
      imageUrl
    ).catch(e => console.error("Background email failed", e));

    return NextResponse.json({
      success: true,
      message: "New pothole report created successfully. The local municipality has been notified.",
      data: newReport,
      isDuplicate: false
    });

  } catch (error: unknown) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const personal = searchParams.get("personal") === "true";
    
    let whereClause = undefined;
    if (personal) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
      whereClause = { user: { email: session.user.email } };
    }

    const reports = await prisma.potholeReport.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error: unknown) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
