'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmailVerification } from '@/components/auth/email-verification';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function EmailVerificationContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const email = searchParams?.get('email');

  const props: { token?: string; email?: string } = {};
  if (token) props.token = token;
  if (email) props.email = email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      <EmailVerification {...props} />
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <EmailVerificationContent />
    </Suspense>
  );
}