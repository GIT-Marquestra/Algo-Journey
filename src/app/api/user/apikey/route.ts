// app/api/user/apikey/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// Encryption
const ALGORITHM = 'aes-256-cbc';
// Ensure the key is exactly 32 bytes for AES-256
let rawKey = process.env.API_KEY_ENCRYPTION_KEY;
if (!rawKey) {
  rawKey = 'something'
}
const ENCRYPTION_KEY = crypto.scryptSync(rawKey, 'salt', 32);

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// GET - Fetch user's API key
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { apiKey: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    if (!user.apiKey) {
      return NextResponse.json(
        { hasApiKey: false }, 
        { status: 200 }
      );
    }

    const decryptedApiKey = decrypt(user.apiKey.key);

    
    return NextResponse.json(
      { 
        hasApiKey: true,
        apiKey: decryptedApiKey
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST - Save/Update user's API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid API key is required' }, 
        { status: 400 }
      );
    }

    // Basic API key format validation (adjust based on your AI provider)
    if (apiKey.length < 20) {
      return NextResponse.json(
        { error: 'API key appears to be invalid' }, 
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { apiKey: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Encrypt the API key before storing
    const encryptedApiKey = encrypt(apiKey.trim());

    // Upsert the API key
    await prisma.userApiKey.upsert({
      where: { userId: user.id },
      update: { key: encryptedApiKey },
      create: {
        key: encryptedApiKey,
        userId: user.id
      }
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'API key saved successfully' 
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE - Remove user's API key
export async function DELETE() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    await prisma.userApiKey.deleteMany({
      where: { userId: user.id }
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'API key removed successfully' 
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

