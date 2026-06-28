"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  UserCog,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { type Role } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navConfig: Record<Role, NavItem[]> = {
  admin: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/students", label: "Students", icon: Users },
    { href: "/invoices", label: "Invoices", icon: FileText },
    { href: "/financial-reports", label: "Financial Reports", icon: BarChart3 },
    { href: "/users", label: "Users", icon: UserCog },
    { href: "/payroll", label: "Payroll", icon: DollarSign },
  ],
  clerk: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/students", label: "Students", icon: Users },
    { href: "/invoices", label: "Invoices", icon: FileText },
  ],
  instructor: [
    { href: "/instructor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/students", label: "Students", icon: Users },
  ],
  student: [
    { href: "/student", label: "My Progress", icon: LayoutDashboard },
  ],
};

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = (user?.role ?? "admin") as Role;
  const navItems = navConfig[role] ?? navConfig.admin;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "flex h-full w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground shadow-sm transition-transform duration-200",
          "fixed inset-y-0 left-0 z-50 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Link
            href="/"
            className="text-xl font-semibold tracking-wide text-sidebar-foreground"
          >
            DSAS
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
