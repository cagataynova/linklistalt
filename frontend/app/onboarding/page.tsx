import type { Metadata } from 'next';
import { AuthGate } from '@/components/auth-gate';
import { OnboardingForm } from '@/components/onboarding-form';

export const metadata: Metadata = { title: 'Profilini tamamla' };
export default function OnboardingPage() { return <AuthGate title="Önce davet kodunla kaydol." description="Profil oluşturmak için geçerli bir davet ve Firebase oturumu gerekiyor." href="/invite" action="Davet kodunu kullan"><main className="auth-page"><OnboardingForm /></main></AuthGate>; }
