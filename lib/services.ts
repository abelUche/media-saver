const SERVICE_NAMES: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  threads: 'Threads',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  googlebusiness: 'Google Business',
};

export function serviceName(service: string) {
  return SERVICE_NAMES[service] ?? service.charAt(0).toUpperCase() + service.slice(1);
}