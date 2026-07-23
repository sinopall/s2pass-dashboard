import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import {
  CustomerNameProvider,
  useCustomerNameContext,
} from "../context/CustomerNameContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

function CustomerNameBadge() {
  const { savedName } = useCustomerNameContext();
  if (!savedName) return null;

  return (
    <div className="fixed top-20 left-1/2 z-99999 -translate-x-1/2 px-4">
      <div className="flex items-center gap-3 rounded-full border border-brand-200 bg-white/95 px-5 py-2.5 shadow-lg backdrop-blur dark:border-brand-500/30 dark:bg-boxdark/95">
        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Nasabah:
        </span>
        <span className="max-w-[220px] truncate text-sm font-extrabold text-black dark:text-white">
          {savedName}
        </span>
      </div>
    </div>
  );
}

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />

        {/* Floating badge nama nasabah — persisten di semua halaman internal */}
        <CustomerNameBadge />

        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <CustomerNameProvider>
        <LayoutContent />
      </CustomerNameProvider>
    </SidebarProvider>
  );
};

export default AppLayout;
