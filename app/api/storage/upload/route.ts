import { NextRequest, NextResponse } from 'next/server';
import {
  uploadFile,
  uploadPortfolioFile,
  uploadProjectDeliverable,
  uploadProfileAvatar,
  uploadProjectMedia,
  generatePresignedUrl,
  deleteFile,
} from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;
    const fileName = file.name;

    let result;

    switch (action) {
      case 'portfolio':
        const userId = formData.get('userId') as string;
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID required for portfolio upload' },
            { status: 400 }
          );
        }
        result = await uploadPortfolioFile(userId, buffer, fileName, contentType);
        break;

      case 'deliverable':
        const projectId = formData.get('projectId') as string;
        const milestoneId = formData.get('milestoneId') as string;
        if (!projectId || !milestoneId) {
          return NextResponse.json(
            { error: 'Project ID and Milestone ID required' },
            { status: 400 }
          );
        }
        result = await uploadProjectDeliverable(projectId, milestoneId, buffer, fileName, contentType);
        break;

      case 'avatar':
        const avatarUserId = formData.get('userId') as string;
        if (!avatarUserId) {
          return NextResponse.json(
            { error: 'User ID required for avatar upload' },
            { status: 400 }
          );
        }
        result = await uploadProfileAvatar(avatarUserId, buffer, contentType);
        break;

      case 'media':
        const mediaProjectId = formData.get('projectId') as string;
        if (!mediaProjectId) {
          return NextResponse.json(
            { error: 'Project ID required for media upload' },
            { status: 400 }
          );
        }
        result = await uploadProjectMedia(mediaProjectId, buffer, contentType);
        break;

      case 'generic':
        const key = formData.get('key') as string;
        if (!key) {
          return NextResponse.json(
            { error: 'Key required for generic upload' },
            { status: 400 }
          );
        }
        result = await uploadFile({
          key,
          body: buffer,
          contentType,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        success: true,
        file: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const key = searchParams.get('key');

    if (action === 'presignedUrl' && key) {
      const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');
      const url = await generatePresignedUrl(key, expiresIn);
      return NextResponse.json({
        success: true,
        url,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Key required' },
        { status: 400 }
      );
    }

    await deleteFile(key);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
