import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { SignInForm } from '../components/signin-form';
import { SocialButtons } from '../components/social-button';

function SignInPage() {
  return (
    <div>
      <SignInForm />
      <Separator className='my-4' />
      <SocialButtons />
      <Link
        className={buttonVariants({
          variant: 'link',
          size: 'sm',
          className: 'mt-4',
        })}
        href={'/signup'}
      >
        新規登録はこちら
      </Link>
    </div>
  );
}

export default SignInPage;
