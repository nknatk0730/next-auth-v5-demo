
import { auth, signOut } from '@/auth';
import { Button } from '@/components/ui/button';
import EditProfileSheet from '@/components/update-profile-sheet';
import Link from 'next/link';
import React from 'react';

async function MyAccountPage() {
  const user = await auth().then((res) => res?.user);

  console.table(user);

  return (
    <div>
      <div className='p-8 flex gap-8'>
        <Button asChild>
          <Link href="/signup">Sign up</Link>
        </Button>

        <Button asChild>
          <Link href="/signin">Sign In</Link>
        </Button>
        <EditProfileSheet />
      </div>
      <form
        className='pl-6'
        action={async () => {
          "use server";

          await signOut();
        }}
      >
        <Button variant={"ghost"} type="submit">
          Sign Out
        </Button>
      </form>
    </div>
  );
}

export default MyAccountPage;