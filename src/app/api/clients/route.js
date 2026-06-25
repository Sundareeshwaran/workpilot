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

    const existingClient = await prisma.client.findUnique({
      where: {
        email,
      },
    });

    if (existingClient) {
      return NextResponse.json(
        {
          success: false,
          message: "Client already exists",
        },
        { status: 409 },
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        companyName,
        email,
        phone,
        website,
        address,
        notes,
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

export async function GET() {
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

    const clients = await prisma.client.findMany({
      where: {
        userId: session.user.id,
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
