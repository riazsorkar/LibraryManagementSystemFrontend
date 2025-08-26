import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Upload,
  Users,
  BookOpen,
  HelpCircle,
  LogOut,
  Layers,
} from "lucide-react";

export default function AdminDashboardSidebar() {
  const location = useLocation();

  const navItem = "flex items-center gap-2 px-3 py-3 text-gray-700 hover:text-sky-500 transition-colors";
  const navItemActive = "flex items-center gap-2 px-3 py-3 text-sky-600 font-medium";

  return (
    <aside className="w-64 bg-white shadow-md px-4 py-6 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-6 text-gray-900">Library</h2>
        <ul className="space-y-2">
          <li>
            <Link
              to="/dashboard"
              className={location.pathname === "/dashboard" ? navItemActive : navItem}
            >
              <CalendarDays size={18} /> Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/manage-books"
              className={location.pathname === "/manage-books" ? navItemActive : navItem}
            >
              <BookOpen size={18} /> Manage Books
            </Link>
          </li>
          <li>
            <Link
              to="/manage-category"
              className={location.pathname === "/manage-category" ? navItemActive : navItem}
            >
              <Layers size={18} /> Manage Category
            </Link>
          </li>

          <li>
            <Link
              to="/manage-author"
              className={location.pathname === "/manage-author" ? navItemActive : navItem}
            >
              <Layers size={18} /> Manage Author
            </Link>
          </li>

          <li>
            <Link
              to="/manage-donation-request"
              className={location.pathname === "/manage-donation-request" ? navItemActive : navItem}
            >
              <Layers size={18} /> Manage Donation Request
            </Link>
          </li>
          <li>
            <Link
              to="/manage-feature"
              className={location.pathname === "/manage-feature" ? navItemActive : navItem}
            >
              <Layers size={18} /> Manage Features
            </Link>
          </li>

          <li>
            <Link
              to="/admin-setting"
              className={location.pathname === "/admin-setting" ? navItemActive : navItem}
            >
              <Layers size={18} /> Setting
            </Link>
          </li>
          
          
          <li>
            <Link
              to="/help"
              className={location.pathname === "/help" ? navItemActive : navItem}
            >
              <HelpCircle size={18} /> Help
            </Link>
          </li>
        </ul>
      </div>
      <div>
        {/* <Link
          to="/logout"
          className="flex items-center gap-2 px-3 py-3 text-red-600 font-medium hover:underline underline-offset-4"
        >
          <LogOut size={18} /> Logout
        </Link> */}
      </div>
    </aside>
  );
}