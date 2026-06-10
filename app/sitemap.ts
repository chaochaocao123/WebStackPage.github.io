import { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/data/tools';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://kjgjs.cn';
  const now = new Date();
  
  const staticPages = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily' as const, priority: 1 },
    { url: `${base}/articles`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${base}/news`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${base}/deals`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${base}/tools/fba-calculator`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${base}/tools/unit-converter`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${base}/tools/exchange-rate`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
  ];
  
  return staticPages;
}
