import { prisma } from '@/lib/db';
import CategoriesClient from './CategoriesClient';

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sort: 'asc' },
    include: {
      _count: {
        select: { tools: true },
      },
    },
  });

  return <CategoriesClient categories={categories} />;
}
