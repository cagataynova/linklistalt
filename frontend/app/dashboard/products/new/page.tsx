import { AuthGate } from '@/components/auth-gate';
import { CreateProductForm } from '@/components/create-product-form';

export const metadata = { title: 'Ürün ekle' };
type Props = {
  searchParams: Promise<{ listId?: string | string[] }>;
};

export default async function NewProductPage({ searchParams }: Props) {
  const requestedListId = (await searchParams).listId;
  const initialListId = Array.isArray(requestedListId)
    ? requestedListId[0]
    : requestedListId;

  return (
    <AuthGate>
      <main className="form-page">
        <CreateProductForm initialListId={initialListId} />
      </main>
    </AuthGate>
  );
}
