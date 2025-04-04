// app/api/admin/migrate-hints-to-two-pointers/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

function createSSEStream() {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  
  return {
    stream: stream.readable,
    write: async (event: string, data: any) => {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type: event, data })}\n\n`)
      );
    },
    close: () => writer.close()
  };
}

export async function GET() {
  
  // Create SSE stream
  const sse = createSSEStream();
  
  // Create background task to handle the migration
  const backgroundTask = async () => {
    try {
      // Make sure the Two Pointers tag exists, create if not
      let twoPointersTag = await prisma.questionTag.findUnique({
        where: { name: "Two Pointers" }
      });
      
      if (!twoPointersTag) {
        twoPointersTag = await prisma.questionTag.create({
          data: { name: "Two Pointers" }
        });
      }
      
      // Send initial progress
      await sse.write('status', 'Starting migration...');
      
      // Get all existing hints
      const existingHints = await prisma.hint.findMany({
        include: { question: true }
      });
      
      const totalHints = existingHints.length;
      await sse.write('status', `Found ${totalHints} existing hints to migrate`);
      
      // For each hint, create a TagHint and Hintnew entries
      let migratedCount = 0;
      
      for (const hint of existingHints) {
        // Check if this question already has a TagHint for Two Pointers
        const existingTagHint = await prisma.tagHint.findUnique({
          where: {
            questionId_tagId: {
              questionId: hint.questionId,
              tagId: twoPointersTag.id
            }
          }
        });
        
        if (!existingTagHint) {
          // Create TagHint for Two Pointers
          const tagHint = await prisma.tagHint.create({
            data: {
              question: { connect: { id: hint.questionId } },
              tag: { connect: { id: twoPointersTag.id } }
            }
          });
          
          // Create three Hintnew entries for this TagHint
          await prisma.hintnew.createMany({
            data: [
              {
                tagHintId: tagHint.id,
                content: hint.hint1,
                sequence: 1
              },
              {
                tagHintId: tagHint.id,
                content: hint.hint2,
                sequence: 2
              },
              {
                tagHintId: tagHint.id,
                content: hint.hint3,
                sequence: 3
              }
            ]
          });
          
          migratedCount++;
        }
        
        // Report progress
        if (migratedCount % 5 === 0 || migratedCount === totalHints) {
          await sse.write('progress', {
            total: totalHints,
            migrated: migratedCount,
            currentQuestion: hint.questionId
          });
        }
      }
      
      // Send final results
      await sse.write('complete', {
        message: `Migration completed. Migrated ${migratedCount} questions' hints to Two Pointers tag.`,
        migratedCount
      });
      
    } catch (error) {
      console.error('Error during migration:', error);
      await sse.write('error', {
        message: 'Error during migration',
        error: error
      });
    } finally {
      await prisma.$disconnect();
      await sse.close();
    }
  };
  
  // Start the background task without waiting for it
  backgroundTask();
  
  // Return the SSE stream response
  return new NextResponse(sse.stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}