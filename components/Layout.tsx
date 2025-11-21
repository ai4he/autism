import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import {
  LayoutDashboard,
  Activity,
  Gift,
  AlertTriangle,
  BarChart3,
  Globe,
} from 'lucide-react';
import UserMenu from './UserMenu';
import ProfileSwitcher from './ProfileSwitcher';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');

  const toggleLanguage = () => {
    const newLocale = i18n.language === 'en' ? 'es' : 'en';
    router.push(router.pathname, router.asPath, { locale: newLocale });
  };

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { href: '/behaviors', icon: Activity, label: t('nav.behaviors') },
    { href: '/reinforcers', icon: Gift, label: t('nav.reinforcers') },
    { href: '/crisis', icon: AlertTriangle, label: t('nav.crisis') },
    { href: '/analytics', icon: BarChart3, label: t('nav.analytics') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400 tracking-tight">
                {t('app_title')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
                {t('app_subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 transition-all hover:shadow-soft border border-transparent hover:border-slate-300 dark:hover:border-gray-600"
                aria-label={t('language.switch')}
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {i18n.language === 'en' ? 'ES' : 'EN'}
                </span>
              </button>
              <ProfileSwitcher />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 left-0 right-0 z-50 shadow-strong">
        <div className="flex justify-around items-center py-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 shadow-soft'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 font-semibold shadow-soft'
                      : 'text-gray-700 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-gray-700 font-medium'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
