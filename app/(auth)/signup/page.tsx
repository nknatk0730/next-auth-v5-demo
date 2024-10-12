import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { SignUpForm } from './components/signup-form';

function SignUpPage() {
  return (
    <div>
      <SignUpForm />
      <Link
        className={buttonVariants({
          variant: 'link',
          size: 'sm',
          className: 'mt-4',
        })}
        href={'/signin'}
      >
        ログインはこちら
      </Link>
    </div>
  );
}

export default SignUpPage;
