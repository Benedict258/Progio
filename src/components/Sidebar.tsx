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
import { AlertBell } from "@/components/AlertBell";

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
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Grants",
    href: "/grants",
    icon: <FileText size={18} />,
    badge: "3 new",
    children: [
      { label: "All Grants", href: "/grants" },
      { label: "Nye's Idea Studio", href: "/grants/brainstorm" },
      { label: "Alerts", href: "/grants/alerts" },
      { label: "Saved", href: "/grants/saved" },
      { label: "My Private", href: "/grants/my-private" },
    ],
  },
  {
    label: "Scholarships",
    href: "/scholarships",
    icon: <GraduationCap size={18} />,
    children: [
      { label: "All Scholarships", href: "/scholarships" },
      { label: "Nye's Idea Studio", href: "/scholarships/brainstorm" },
      { label: "Alerts", href: "/scholarships/alerts" },
      { label: "Saved", href: "/scholarships/saved" },
      { label: "My Private", href: "/scholarships/my-private" },
    ],
  },
  {
    label: "Research",
    href: "/research",
    icon: <FlaskConical size={18} />,
    children: [
      { label: "Literature Discovery", href: "/research/literature" },
      { label: "Citation Manager", href: "/research/citations" },
      { label: "Research Studio", href: "/research/studio" },
      { label: "My Research Projects", href: "/research/projects" },
    ],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: <FolderKanban size={18} />,
    children: [
      { label: "Active Projects", href: "/projects" },
      { label: "Completed Projects", href: "/projects/completed" },
    ],
  },
  {
    label: "Readiness",
    href: "/readiness",
    icon: <CheckCircle size={18} />,
    children: [
      { label: "Grant Readiness", href: "/readiness/grant" },
      { label: "Scholarship Readiness", href: "/readiness/scholarship" },
      { label: "Research Readiness", href: "/readiness/research" },
    ],
  },
  {
    label: "Profile",
    href: "/profile",
    icon: <User size={18} />,
  },
  {
    label: "Demo",
    href: "/demo",
    icon: <Rocket size={18} />,
  },
];

function NavItemComponent({ item, pathname, onMobileClose }: { item: NavItem; pathname: string; onMobileClose?: () => void }) {
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
            "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors",
            isActive
              ? "bg-slate-800 text-white"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          )}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded-full">
              {item.badge}
            </span>
          )}
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {expanded && item.children && (
          <div className="ml-6 mt-0.5 space-y-0.5">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onMobileClose}
                className={cn(
                  "block px-2.5 py-1.5 rounded-md text-[12px] transition-colors",
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
      onClick={onMobileClose}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors",
        isActive
          ? "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      )}
    >
      {item.icon}
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded-full">
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
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
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
          "fixed lg:static inset-y-0 left-0 z-40 w-60 bg-[#0f172a] text-white flex flex-col transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FlaskConical size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Progio</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              pathname={pathname}
              onMobileClose={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-2 border-t border-slate-800">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              v0.1
            </div>
            <AlertBell />
          </div>
        </div>
      </aside>
    </>
  );
}
