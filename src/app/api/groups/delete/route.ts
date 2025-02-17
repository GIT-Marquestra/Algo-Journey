import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {

    const { groupId } = await req.json();

    // Validate input
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Check if the group exists
    const group = await prisma.group.findFirst({
      where: {
        id: groupId
      }
    });

    if (!group) {
      return NextResponse.json({ 
        error: 'Group not found' 
      }, { status: 404 });
    }

    // Delete associated records first (using prisma's cascade deletion if configured)
    await prisma.$transaction([
      prisma.group.delete({
        where: { id: groupId }
      })
    ]);

    return NextResponse.json({ 
      message: 'Group successfully deleted',
      groupId
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred while deleting the group' 
    }, { status: 500 });
  }
}