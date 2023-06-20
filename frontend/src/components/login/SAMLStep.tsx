import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { Button, Input } from '@app/components/v2';

type Props = {
    setStep: (step: string) => void;
}

export default function SAMLStep({
    setStep
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const { t } = useTranslation();

  return (
      <div className="mx-auto w-full max-w-md md:px-6">
        <p className="mx-auto mb-6 flex w-max justify-center text-xl font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-bunker-200 text-center mb-8">
          What’s your email?
        </p>
        <div className="relative flex items-center justify-center lg:w-1/6 w-1/4 min-w-[20rem] md:min-w-[22rem] mx-auto w-full rounded-lg max-h-24 md:max-h-28">
          <div className="flex items-center justify-center w-full rounded-lg max-h-24 md:max-h-28">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email..."
              isRequired
              autoComplete="email"
              id="email"
              className="h-12"
            />
          </div>
        </div>
        <div className='lg:w-1/6 w-1/4 w-full mx-auto flex items-center justify-center min-w-[20rem] md:min-w-[22rem] text-center rounded-md mt-4'>
          <Button
              colorSchema="primary" 
              variant="outline_bg"
              onClick={() => {
                if (email === '') return;
                window.open(`/api/v1/auth/auth?email=${email}`);
              }} 
              isFullWidth
              className="h-14"
          > 
              {t('login.login')} 
          </Button>
        </div>
        <div className="flex flex-row items-center justify-center mt-4">
          <button
            onClick={() => {
                setStep('main');
            }}
            type="button"
            className="text-bunker-300 text-sm hover:underline mt-2 hover:underline-offset-4 hover:decoration-primary-700 hover:text-bunker-200 duration-200 cursor-pointer"
          >
            {t('login.other-option')}
          </button>
        </div>
      </div>
  );
}
