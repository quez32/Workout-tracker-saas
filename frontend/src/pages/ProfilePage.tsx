import { useAuth } from '@/lib/auth';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="card mb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-900">Account Type</p>
            <p className="text-xs text-gray-500">Free</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Free</span>
        </div>
      </div>

      <button onClick={logout} className="btn-secondary text-red-600 hover:text-red-700">
        Sign out
      </button>
    </div>
  );
}