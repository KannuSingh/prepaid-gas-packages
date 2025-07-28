//file: demo-counter-app/app/api/identity/[commitment]/pools/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SubgraphClient } from '@prepaid-gas/data';
import { SERVER_CONFIG } from '@/constants/config';

export async function GET(request: NextRequest, context: { params: Promise<{ commitment: string }> }) {
  try {
    const { commitment } = await context.params;

    // Validate input
    if (!commitment || commitment.length < 10) {
      return NextResponse.json({ error: 'Invalid identity commitment' }, { status: 400 });
    }

    // Validate server configuration
    if (!SERVER_CONFIG.subgraph) {
      console.error('❌ SUBGRAPH_URL environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // ✨ NEW: Use factory method with Base Sepolia preset (chainId: 84532)
    const subgraphClient = SubgraphClient.createForNetwork(84532, {
      subgraphUrl: SERVER_CONFIG.subgraph,
    });

    // ✨ NEW: Use query builder instead of direct method call
    // Before: const poolsResponse = await subgraphClient.getPoolsByIdentity(commitment);
    // After: Use the convenience method from QueryBuilder
    const poolsData = await subgraphClient
      .query()
      .activities()
      .byType('DEPOSIT')
      .byCommitment(commitment)
      .executeAndSerialize();

    console.log({ poolsData });
    // Return with caching headers (5 minutes cache)
    return NextResponse.json(poolsData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('❌ API: Error fetching pools:', error);
    return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 });
  }
}
