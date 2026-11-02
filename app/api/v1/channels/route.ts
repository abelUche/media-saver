import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getAccessToken, bufferRequest } from '@/lib/buffer';
import { ApiError, errorResponse } from '@/lib/errors';

type OrganizationsResult = {
  account: { organizations: { id: string; name: string }[] };
};

type ChannelsResult = {
  channels: { id: string; name: string; service: string }[];
};

const ORGANIZATIONS_QUERY = `
  query GetOrganizations {
    account {
      organizations { id name }
    }
  }
`;

const CHANNELS_QUERY = `
  query GetChannels($organizationId: OrganizationId!) {
    channels(input: { organizationId: $organizationId }) {
      id
      name
      service
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      throw new ApiError('Not logged in or invalid API key', 401);
    }

    const accessToken = await getAccessToken(userId);
    const { account } = await bufferRequest<OrganizationsResult>(accessToken, ORGANIZATIONS_QUERY);

    const channels = [];
    for (const organization of account.organizations) {
      const result = await bufferRequest<ChannelsResult>(accessToken, CHANNELS_QUERY, {
        organizationId: organization.id,
      });
      for (const channel of result.channels) {
        channels.push({ ...channel, organizationName: organization.name });
      }
    }

    return NextResponse.json({ channels });
  } catch (error) {
    return errorResponse(error);
  }
}