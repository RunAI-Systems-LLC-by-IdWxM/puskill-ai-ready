export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { handleEdgeChatPost } = await import('@/lib/chat/edge-handler');
    return await handleEdgeChatPost(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: 'worker_boot_failed', message }, { status: 500 });
  }
}
