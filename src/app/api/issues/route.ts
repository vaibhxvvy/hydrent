import { NextResponse } from "next/server";
import { createTransport } from "nodemailer";
import { getPrisma } from "@/lib/db";

// Handler for the POST request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message, subject } = body;

    // Save the issue to the database
    const prisma = getPrisma();
    
    const issueReport = await prisma.issueReport.create({
      data: {
        name: name || null,
        email: email || null,
        subject: subject || "Issue Report",
        message: message
      }
    });

    // Configure the email transport
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Send email notification
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "labusepc@gmail.com",
      subject: subject || "New Issue Report",
      text: `From: ${name || "Anonymous"} (${email || "No email provided"})\n\n${message}`
    });

    return NextResponse.json({ 
      success: true, 
      message: "Issue reported successfully" 
    });
  } catch (error) {
    console.error("Error processing issue report:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to process issue report" 
    }, { status: 500 });
  }
}