import { getAccessToken, bufferRequest } from '@/lib/buffer';

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