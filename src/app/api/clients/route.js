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

    const cleanEmail = email && email.trim() !== "" ? email.trim() : null;

    if (cleanEmail) {
      const existingClient = await prisma.client.findUnique({
        where: {
          email: cleanEmail,
        },
      });

      if (existingClient) {
        return NextResponse.json(
          {
            success: false,
            message: "Client with this email already exists",
          },
          { status: 409 },
        );
      }
    }

    const client = await prisma.client.create({
      data: {
        name,
        companyName: companyName?.trim() || null,
        email: cleanEmail,
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
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
