import { LayoutDashboard, Monitor, AlertTriangle, TrendingUp, BarChart3, Zap } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Asset Monitoring", url: "/assets", icon: Monitor },
  { title: "Alerts", url: "/alerts", icon: AlertTriangle },
  { title: "Predictions", url: "/predictions", icon: TrendingUp },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight">AI Energy</h1>
            <p className="text-xs text-muted-foreground">Monitoring System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              activeClassName=""
            >
              <item.icon className="w-4 h-4" />
              <span>{item.title}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="glass-card p-3">
          <p className="text-xs text-muted-foreground">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
            <span className="text-xs text-foreground font-medium">All Systems Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
