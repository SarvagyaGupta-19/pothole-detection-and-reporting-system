import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await props.params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json({ success: false, message: "Missing ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!["REPORTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const updatedReport = await prisma.potholeReport.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedReport,
      message: "Report status updated successfully"
    });
  } catch (error) {
    console.error("Error updating report status:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await props.params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json({ success: false, message: "Missing ID" }, { status: 400 });
    }

    // Optional: verify the user owns this report, but skipping for demo simplicity
    await prisma.potholeReport.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Report deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
