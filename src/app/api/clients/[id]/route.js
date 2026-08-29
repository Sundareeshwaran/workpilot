import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/validations/client.validation";
import { auth } from "@/auth";

// GET /api/clients/[id] - Fetch single client details with projects & invoices
export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Client ID is required",
        },
        { status: 400 },
      );
    }

    const client = await prisma.client.findUnique({
      where: {
        id,
      },
      include: {
        projects: {
          orderBy: {
            createdAt: "desc",
          },
        },
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          message: "Client not found",
        },
        { status: 404 },
      );
    }

    // Authorization check
    if (client.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You do not have access to this client",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Client fetched successfully",
        client,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

// PATCH /api/clients/[id] - Update client details
export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Client ID is required",
        },
        { status: 400 },
      );
    }

    // Verify client exists and belongs to current user
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json(
        {
          success: false,
          message: "Client not found",
        },
        { status: 404 },
      );
    }

    if (existingClient.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You do not have permission to edit this client",
        },
        { status: 403 },
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

    // 1. Check duplicate Email (excluding this client)
    if (cleanEmail) {
      const emailConflict = await prisma.client.findFirst({
        where: {
          id: { not: id },
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

    // 2. Check duplicate Phone Number (excluding this client)
    if (cleanPhone) {
      const phoneConflict = await prisma.client.findFirst({
        where: {
          id: { not: id },
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

    // 3. Check duplicate Company Name (excluding this client)
    if (cleanCompanyName) {
      const companyConflict = await prisma.client.findFirst({
        where: {
          id: { not: id },
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

    // 4. Check duplicate Client Name (excluding this client)
    const nameConflict = await prisma.client.findFirst({
      where: {
        id: { not: id },
        userId: session.user.id,
        name: { equals: cleanName, mode: "insensitive" },
      },
    });

    if (nameConflict) {
      return NextResponse.json(
        {
          success: false,
          message: `Another client named "${cleanName}" already exists in your workspace.`,
        },
        { status: 409 },
      );
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: cleanName,
        companyName: cleanCompanyName,
        email: cleanEmail,
        phone: cleanPhone,
        website: cleanWebsite,
        address: cleanAddress,
        notes: cleanNotes,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Client updated successfully",
        client: updatedClient,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/clients/[id] - Delete client and associated records
export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Client ID is required",
        },
        { status: 400 },
      );
    }

    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json(
        {
          success: false,
          message: "Client not found",
        },
        { status: 404 },
      );
    }

    if (existingClient.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You do not have permission to delete this client",
        },
        { status: 403 },
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Client deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
