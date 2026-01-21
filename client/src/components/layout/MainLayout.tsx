import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { LayoutDashboard, ShoppingCart, Package, Settings, LogOut, Menu, UserCircle, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    window.location.href = '/auth';
    return null;
  }

  const role = user.role;

  const navItems = [
    { label: 'POS', icon: ShoppingCart, href: '/pos' },
    ...(role === 'admin' ? [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
      { label: 'Products', icon: Package, href: '/products' },
      { label: 'Reports', icon: Receipt, href: '/reports' },
      { label: 'Settings', icon: Settings, href: '/settings' },
    ] : []),
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-6 border-b border-sidebar-border/20">
        <h1 className="text-2xl font-bold tracking-tight text-white">ProPOS</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Professional System</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md font-medium" 
                    : "hover:bg-sidebar-accent/50 hover:text-white text-sidebar-foreground/80"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border/20">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-sidebar-accent/30">
          <UserCircle className="h-8 w-8 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate capitalize">{role}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/10"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-full shrink-0 shadow-xl z-20">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r-0">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden flex items-center justify-between p-4 bg-sidebar text-white shadow-md">
           <div className="flex items-center gap-2">
             <Button 
               variant="ghost" 
               size="icon" 
               className="text-white"
               onClick={() => setIsMobileOpen(true)}
             >
               <Menu className="h-6 w-6" />
             </Button>
             <span className="font-bold text-lg">ProPOS</span>
           </div>
           <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold">{role === 'admin' ? 'A' : 'C'}</span>
           </div>
        </header>
        <div className="flex-1 overflow-auto bg-slate-50/50">
          {children}
        </div>
      </main>
    </div>
  );
}
