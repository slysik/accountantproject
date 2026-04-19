import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/contact', '/terms', '/privacy'],
        disallow: ['/dashboard/', '/settings/', '/setup/', '/mfa/', '/onboard/', '/subscribe/', '/api/'],
      },
    ],
    sitemap: 'https://accountantsbestfriend.com/sitemap.xml',
  };
}
