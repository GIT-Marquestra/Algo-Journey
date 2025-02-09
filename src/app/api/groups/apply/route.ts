import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust the import according to your setup
import { ApplicationStatus } from '@prisma/client'; // Import the ApplicationStatus enum if needed

export async function POST(req: Request) {
  const { groupId, userEmail } = await req.json(); // Extract groupId and userEmail from the request body

  try {
    // Validate input
    if (!groupId || !userEmail) {
      return NextResponse.json({ error: 'Group ID and user email are required' }, { status: 400 });
    }

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    const applicantId = user?.id;

    console.log('Applicant id: ', applicantId);

    if (!applicantId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check if the user is already in the group
    const isMember = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            id: applicantId,
          },
        },
      },
    });

    if (isMember) {
      return NextResponse.json({ error: 'You are already a member of this group', status: 410 });
    }

    // Check if the applicant has already applied to this group
    const existingApplication = await prisma.groupApplication.findUnique({
      where: {
        applicantId_groupId: {
          applicantId,
          groupId,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this group' }, { status: 400 });
    }

    // Create a new application entry
    const application = await prisma.groupApplication.create({
      data: {
        applicantId,
        groupId,
        status: ApplicationStatus.PENDING, // Set initial status to PENDING
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Error applying to group:', error); // Log the error for debugging
    return NextResponse.json({ error: 'Failed to apply to group' }, { status: 500 });
  }
}