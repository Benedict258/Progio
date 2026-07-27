"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  FlaskConical,
  FolderKanban,
  CheckCircle,
  User,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Grants",
    href: "/grants",
    icon: <FileText size={20} />,
    badge: "3 new",
    children: [
      { label: "All Grants", href: "/grants" },
      { label: "Alerts", href: "/grants/alerts" },
      { label: "Saved", href: "/grants/saved" },
      { label: "My Private", href: "/grants/my-private" },
    ],
  },
  {
    label: "Scholarships",
    href: "/scholarships",
    icon: <GraduationCap size={20} />,
    children: [
      { label: "All Scholarships", href: "/scholarships" },
      { label: "Alerts", href: "/scholarships/alerts" },
      { label: "Saved", href: "/scholarships/saved" },
      { label: "My Private", href: "/scholarships/my-private" },
    ],
  },
  {
    label: "Research",
    href: "/research",
    icon: <FlaskConical size={20} />,
    children: [
      { label: "Literature Discovery", href: "/research/literature" },
      { label: "Citation Manager", href: "/research/citations" },
      { label: "My Research Projects", href: "/research/projects" },
    ],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: <FolderKanban size={20} />,
    children: [
      { label: "Active Projects", href: "/projects" },
      { label: "Completed Projects", href: "/projects/completed" },
    ],
  },
  {
    label: "Readiness Assessments",
    href: "/readiness",
    icon: <CheckCircle size={20} />,
    children: [
      { label: "Grant Readiness", href: "/readiness/grant" },
      { label: "Scholarship Readiness", href: "/readiness/scholarship" },
      { label: "Research Readiness", href: "/readiness/research" },
    ],
  },
  {
    label: "Profile",
    href: "/profile",
    icon: <User size={20} />,
  },
  {
    label: "Demo Flow",
    href: "/demo",
    icon: <Rocket size={20} />,
  },
];

function NavItemComponent({ item, pathname }: { item: NavItem; pathname: string }) {
  const [expanded, setExpanded] = useState(
    item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))
  );

  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive
              ? "bg-slate-800 text-white"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          )}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded-full">
              {item.badge}
            </span>
          )}
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {expanded && item.children && (
          <div className="ml-9 mt-1 space-y-0.5">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm transition-colors",
                  pathname === child.href
                    ? "bg-indigo-600 text-white font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      )}
    >
      {item.icon}
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0f172a] text-white flex flex-col transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FlaskConical size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Progio</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItemComponent key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-slate-800">
          <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider">
            Progio v0.1
          </div>
        </div>
      </aside>
    </>
  );
}
