import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/validations/client.validation";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validateFields = clientSchema.safeParse(body);

    if (!validateFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input data",
          errors: validateFields.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { name, companyName, email, phone, website, address, notes } =
      validateFields.data;

    const cleanName = name.trim();
    const cleanCompanyName = companyName?.trim() || null;
    const cleanEmail = email && email.trim() !== "" ? email.trim() : null;
    const cleanPhone = phone && phone.trim() !== "" ? phone.trim() : null;
    const cleanWebsite = website && website.trim() !== "" ? website.trim() : null;
    const cleanAddress = address && address.trim() !== "" ? address.trim() : null;
    const cleanNotes = notes && notes.trim() !== "" ? notes.trim() : null;

    // 1. Check duplicate Email
    if (cleanEmail) {
      const emailConflict = await prisma.client.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" },
        },
      });

      if (emailConflict) {
        return NextResponse.json(
          {
            success: false,
            message: `A client with the email "${cleanEmail}" already exists.`,
          },
          { status: 409 },
        );
      }
    }

    // 2. Check duplicate Phone Number for this user
    if (cleanPhone) {
      const phoneConflict = await prisma.client.findFirst({
        where: {
          userId: session.user.id,
          phone: cleanPhone,
        },
      });

      if (phoneConflict) {
        return NextResponse.json(
          {
            success: false,
            message: `A client with the phone number "${cleanPhone}" already exists.`,
          },
          { status: 409 },
        );
      }
    }

    // 3. Check duplicate Company Name for this user
    if (cleanCompanyName) {
      const companyConflict = await prisma.client.findFirst({
        where: {
          userId: session.user.id,
          companyName: { equals: cleanCompanyName, mode: "insensitive" },
        },
      });

      if (companyConflict) {
        return NextResponse.json(
          {
            success: false,
            message: `A client for company "${cleanCompanyName}" already exists.`,
          },
          { status: 409 },
        );
      }
    }

    // 4. Check duplicate Client Name for this user
    const nameConflict = await prisma.client.findFirst({
      where: {
        userId: session.user.id,
        name: { equals: cleanName, mode: "insensitive" },
      },
    });

    if (nameConflict) {
      return NextResponse.json(
        {
          success: false,
          message: `A client named "${cleanName}" already exists in your workspace.`,
        },
        { status: 409 },
      );
    }

    const client = await prisma.client.create({
      data: {
        name: cleanName,
        companyName: cleanCompanyName,
        email: cleanEmail,
        phone: cleanPhone,
        website: cleanWebsite,
        address: cleanAddress,
        notes: cleanNotes,
        user: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Client added successfully",
        client,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const whereClause = {
      userId: session.user.id,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { companyName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const clients = await prisma.client.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Clients fetched successfully",
        clients,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
