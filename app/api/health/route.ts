export const runtime = 'edge';

export async function GET() {
  return Response.json({
    ok: true,
    service: 'puskill-chat',
    runtime: 'edge',
    ts: Date.now(),
  });
}
