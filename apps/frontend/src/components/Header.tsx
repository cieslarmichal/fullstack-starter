import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/Menubar';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';

export default function Header() {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const navigate = useNavigate();

  const initial = (userData?.email?.[0] || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center px-4 sm:px-6 lg:px-8 py-3">
        <div className="w-48 flex items-center">
          <Link
            to={'/'}
            className="flex items-center gap-3 group"
          >
            <div className="h-9 w-9 bg-black rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-lg">FS</span>
            </div>
            <span className="hidden sm:block text-xl font-bold text-black tracking-tight whitespace-nowrap">
              Fullstack Starter
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-end">
          {!userDataInitialized ? (
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Gentle avatar placeholder while auth initializes */}
              <Skeleton className="h-10 w-10 rounded-full bg-muted" />
            </div>
          ) : userData ? (
            <div className="min-w-[120px] flex justify-end">
              <Menubar className="rounded-none space-x-0 border-none data-[state=open]:!bg-none">
                <MenubarMenu>
                  <MenubarTrigger
                    omitOpenBg
                    className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-200 hover:ring-black transition-all p-0 cursor-pointer"
                  >
                    <span className="h-full w-full flex items-center justify-center text-sm font-semibold text-black">
                      {initial}
                    </span>
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem
                      onClick={() => {
                        navigate('/logout');
                      }}
                      className="pt-2 hover:text-primary cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          ) : (
            <div className="min-w-[120px] flex items-center gap-3 justify-end">
              <Button
                variant="link"
                size="lg"
                onClick={() => navigate('/login')}
                className="text-sm text-gray-600 hover:text-black font-medium"
              >
                Login
              </Button>
              <Button
                size="lg"
                onClick={() => navigate('/login?tab=register')}
                className="text-sm bg-black hover:bg-gray-800 transition-colors font-semibold text-white rounded-md"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
