import { usePlans } from '../../hooks/usePlans';
import './ProfilePage.css';
import { ProfileSection } from '../../components/ProfileSection/ProfileSection';
import { Skeleton } from '../../components/ui/skeleton';

export const ProfilePage = () => {
  const { plans, loading } = usePlans();

  return (
    <main className="profile-page container py-10">
      <div className="mb-8 max-w-3xl">
        <span className="text-sm font-semibold uppercase text-sky-200">Личный кабинет</span>
        <h1 className="mt-3 text-4xl font-black tracking-normal text-white md:text-5xl">Избранное и история просмотров</h1>
      </div>
      {loading ? <Skeleton className="h-96" /> : <ProfileSection plans={plans} />}
    </main>
  );
};
