import { getAccessToken, bufferRequest } from '@/lib/buffer';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export type Channel = {
  id: string;
  name: string;
  service: string;
  organizationName: string;
};

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

export async function listChannels(userId: string): Promise<Channel[]> {
  const accessToken = await getAccessToken(userId);
  const { account } = await bufferRequest<OrganizationsResult>(accessToken, ORGANIZATIONS_QUERY);

  const channels: Channel[] = [];
  for (const organization of account.organizations) {
    const result = await bufferRequest<ChannelsResult>(accessToken, CHANNELS_QUERY, {
      organizationId: organization.id,
    });
    for (const channel of result.channels) {
      channels.push({ ...channel, organizationName: organization.name });
    }
  }
  return channels;
}

const CACHE_MS = 10 * 60 * 1000;

export async function getChannels(userId: string): Promise<Channel[]> {
  const [user] = await db
    .select({ cache: users.channelsCache, cachedAt: users.channelsCachedAt })
    .from(users)
    .where(eq(users.id, userId));

  const cacheIsFresh =
    user?.cache && user.cachedAt && Date.now() - user.cachedAt.getTime() < CACHE_MS;
  if (cacheIsFresh) {
    return user.cache!;
  }

  try {
    const channels = await listChannels(userId);
    await db
      .update(users)
      .set({ channelsCache: channels, channelsCachedAt: new Date() })
      .where(eq(users.id, userId));
    return channels;
  } catch (error) {
    if (user?.cache) {
      console.warn('Using cached channels because Buffer could not be reached:', error);
      return user.cache;
    }
    throw error;
  }
}