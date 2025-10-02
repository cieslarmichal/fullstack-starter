import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/Menubar';
import { Button } from './ui/Button';

export default function Header() {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const initial = (userData?.email?.[0] || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center px-4 sm:px-6 lg:px-8 py-2">
        <div className="w-48 flex items-center">
          <Link
            to={'/'}
            className="flex items-center gap-2"
          >
            <div className="h-9 w-9 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="hidden sm:block text-xl font-bold text-slate-800">Monorepo</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-end">
          {userData ? (
            <div className="min-w-[120px] flex justify-end">
              <Menubar className="rounded-none space-x-0 border-none data-[state=open]:!bg-none">
                <MenubarMenu>
                  <MenubarTrigger
                    omitOpenBg
                    className="h-10 w-10 rounded-full overflow-hidden bg-slate-200 ring-1 ring-slate-300 hover:ring-teal-500 transition p-0 cursor-pointer"
                  >
                    <span className="h-full w-full flex items-center justify-center text-sm font-semibold text-slate-700">
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
            <div className="min-w-[120px] flex items-center gap-2 justify-end">
              <Button
                variant="link"
                size="lg"
                onClick={() => navigate('/login')}
                className="text-sm text-slate-600"
              >
                Login
              </Button>
              <Button
                size="lg"
                onClick={() => navigate('/login?tab=register')}
                className="text-sm hover:from-teal-700 hover:to-emerald-600 transition-all duration-300 font-semibold text-white rounded-md"
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
