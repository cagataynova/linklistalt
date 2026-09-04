import { AuthGate } from '@/components/auth-gate';
import { CreateProductForm } from '@/components/create-product-form';

export const metadata = { title: 'Ürün ekle' };
export default function NewProductPage() { return <AuthGate><main className="form-page"><CreateProductForm /></main></AuthGate>; }
