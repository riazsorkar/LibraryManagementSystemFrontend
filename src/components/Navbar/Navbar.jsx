import {
  Bell,
  MessageSquare,
  Search,
  Upload,
  UserCircle,
  X,
} from "lucide-react";
import { CgMenuGridR } from "react-icons/cg";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import AppLauncherMenu from "./AppLauncherMenu"; // ← NEW
import api from "../../api";

export default function Navbar() {
  const navigate = useNavigate();

  // UI state
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [openNoti, setOpenNoti] = useState(false);
  const [setOpenMsg] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const searchRef = useRef(null);


   const [openGrid, setOpenGrid] = useState(false);

   const gridRef = useRef(null); // anchor for the grid icon/menu
  // Auth state
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("authUser")) || null;
    } catch {
      return null;
    }
  });

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/user/profile');
        setUserProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/Notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Load books for search
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await api.get('/Books');
        setBooks(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch books:', error);
        setBooks([]);
      }
    };

    fetchBooks();
  }, []);

  // Close popups on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(e.target)) {
        setOpenNoti(false);
        setOpenMsg(false);
        setOpenUser(false);
        
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Fetch notifications when notification panel opens
  useEffect(() => {
    if (openNoti) {
      fetchNotifications();
    }
  }, [openNoti]);

  // Demo message data

  // Live search results (by title, authors, category, summary)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hit = (v) =>
      typeof v === "string" && v.toLowerCase().includes(q);
    return books
      .filter(
        (b) =>
          hit(b.title) ||
          hit(b.authors || b.author || "") ||
          hit(b.category || "") ||
          hit(b.summary || b.description || "")
      )
      .slice(0, 8);
  }, [books, query]);

  const goToBook = (id) => {
    setQuery("");
    setShowSearch(false);
    navigate(`/book/${id}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (results[0]) goToBook(results[0].id);
  };

  const handleSignOut = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setUser(null);
    setUserProfile(null);
    setOpenUser(false);
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white">
      {/* Container */}
      <div className="flex items-center justify-between mx-auto px-4 sm:px-6 lg:px-8 h-16">
        {/* Left: Logo + Grid */}
        <div className="flex items-center h-full">
          <Link to="/" className="flex items-center h-full">
            <img
              src="/BSlogo-removebg-preview.png"
              alt="Logo"
              className="h-[80] w-auto max-h-[120px] object-contain cursor-pointer px-15"
            />
          </Link>
          <AppLauncherMenu
            gridRef={gridRef}
            openGrid={openGrid}
            setOpenGrid={setOpenGrid}
            setOpenNoti={setOpenNoti}
            setOpenMsg={setOpenMsg}
            setOpenUser={setOpenUser}
          />
        </div>

        {/* Right: Upload button + icons */}
        <div className="flex items-center gap-3 sm:gap-4 h-full" ref={searchRef}>
          {/* Icons */}
          <div className="flex items-center gap-3 sm:gap-4 relative">
            {/* Notifications */}
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => {
                setOpenNoti((v) => !v);
                setOpenMsg(false);
                setOpenUser(false);
              }}
              className="relative"
            >
              <Bell className="w-5 h-5 text-gray-700 cursor-pointer" />
              {/* unread dot - show only if there are unread notifications */}
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Search */}
            <button
              type="button"
              aria-label="Search"
              onClick={() => setShowSearch((v) => !v)}
            >
              <Search className="w-5 h-5 text-gray-700 cursor-pointer" />
            </button>

            {/* User */}
            <button
              type="button"
              aria-label="User menu"
              onClick={() => {
                setOpenUser((v) => !v);
                setOpenNoti(false);
                setOpenMsg(false);
              }}
            >
              <UserCircle className="w-6 h-6 text-gray-700 cursor-pointer" />
            </button>

            {/* Notifications panel */}
            {openNoti && (
              <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b font-semibold text-gray-800">
                  Notifications
                </div>
                <ul className="max-h-80 overflow-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <li
                        key={n.id}
                        className="px-4 py-3 hover:bg-gray-50 text-sm text-gray-700"
                      >
                        <div className="font-medium">{n.Title}</div>
                        <div className="text-gray-600">{n.Message}</div>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-sm text-gray-500 text-center">
                      No notifications
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* User menu */}
            {openUser && (
              <div className="absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <div className="text-sm text-gray-600">
                    {user ? "Signed in as" : "Welcome"}
                  </div>
                  <div className="font-semibold text-gray-800">
                    {userProfile?.username}
                  </div>
                </div>
                <ul className="py-1 text-sm">
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
                      onClick={() => {
                        setOpenUser(false);
                        navigate("/UserDashboard");
                      }}
                    >
                      Dashboard
                    </button>
                  </li>
                  {/* <li>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
                      onClick={() => {
                        setOpenUser(false);
                        navigate("/donation-request");
                      }}
                    >
                      Donate a Book
                    </button>
                  </li> */}
                </ul>
                <div className="border-t">
                  {/* <button
                    className="w-full px-4 py-2 text-left text-sky-600 font-semibold hover:bg-gray-50"
                    onClick={user ? handleSignOut : () => navigate("/login")}
                  >
                    {user ? "Sign Out" : "Sign In"}
                  </button> */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animated search bar overlay (responsive) */}
      <div
        className={`transition-[max-height] duration-300 ease-out overflow-hidden border-t border-gray-100 ${
          showSearch ? "max-h-80" : "max-h-0"
        }`}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 h-11"
          >
            <Search className="w-5 h-5 text-gray-500" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, category…"
              className="flex-1 bg-transparent outline-none text-sm px-3"
            />
            {query && (
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={() => setQuery("")}
                aria-label="Clear"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <button
              type="submit"
              className="ml-2 px-4 h-8 rounded-full text-white bg-sky-500 hover:bg-sky-600 text-sm font-medium"
            >
              Search
            </button>

            {/* Results dropdown */}
            {showSearch && (results.length > 0 || query) && (
              <div className="absolute left-0 right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {results.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500">
                    No matches for “{query}”
                  </div>
                ) : (
                  <ul className="max-h-80 overflow-auto divide-y">
                    {results.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => goToBook(b.id)}
                      >
                        <img
                          src={b.coverImage || b.image}
                          alt={b.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-800 truncate">
                            {b.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {(b.authors || b.author) ?? "Unknown"} • {b.category ?? "General"}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </header>
  );
}