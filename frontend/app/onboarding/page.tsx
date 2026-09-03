import type { Metadata } from 'next'; import { OnboardingForm } from '@/components/onboarding-form';
export const metadata: Metadata = { title: 'Profilini tamamla' }; export default function OnboardingPage() { return <main className="auth-page"><OnboardingForm /></main>; }
