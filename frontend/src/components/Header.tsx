import { Shield } from "lucide-react";

const Header = () => {
  // const location = useLocation();

  // const navItems = [
  //   { path: "/", label: "Home", icon: Upload },
  //   { path: "/analysis", label: "Analysis", icon: BarChart3 },
  //   { path: "/streaming-analysis", label: "Streaming", icon: Radio },
  // ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Bank Statement Summarizer
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                Privacy-Focused
              </span>
            </div>
          </div>

          {/* <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
