// Sidebar.jsx
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

const CAT_MAX_H = "max-h-96";

export default function Sidebar({ onSelect }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch books and categories from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [booksResponse, categoriesResponse] = await Promise.all([
          api.get('/Books'),
          api.get('/Categories')
        ]);
        
        setAllBooks(Array.isArray(booksResponse.data) ? booksResponse.data : []);
        setCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAllBooks([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Count books per category
  const catCounts = useMemo(() => {
    const m = {};
    categories.forEach((c) => {
      m[c.name] = allBooks.filter(b => b.categoryName === c.name).length;
    });
    return m;
  }, [categories, allBooks]);

  const handleCategoryToggle = (categoryName) => {
    setSelectedCategories(prev => {
      const newSelection = prev.includes(categoryName)
        ? prev.filter(cat => cat !== categoryName)
        : [...prev, categoryName];
      
      // Update filter immediately when categories change
      if (onSelect) {
        if (newSelection.length === 0) {
          onSelect({ type: "all" });
        } else {
          onSelect({ 
            type: "categories", 
            categories: newSelection 
          });
        }
      }
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    setSelectedCategories([]);
    if (onSelect) {
      onSelect({ type: "all" });
    }
  };

  if (loading) {
    return (
      <aside className="hidden md:block w-64 bg-white p-4 border-r border-gray-200 sticky top-28">
        <div className="text-gray-500">Loading categories...</div>
      </aside>
    );
  }

  return (
    <aside className="hidden md:block w-64 bg-white p-4 border-r border-gray-200 sticky top-28 overflow-y-hidden space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-2">Book Categories</h3>

        <div className={`overflow-y-auto ${CAT_MAX_H} pr-1`}>
          <ul className="space-y-1 mb-2">
            <li>
              <button
                onClick={handleSelectAll}
                className={`w-full text-left text-sm px-2 py-2 rounded block hover:bg-sky-100 transition-all duration-200 font-medium ${
                  selectedCategories.length === 0 
                    ? "text-sky-700 bg-sky-50" 
                    : "text-gray-700"
                }`}
              >
                All Categories
              </button>
            </li>
          </ul>

          <ul className="space-y-1">
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.name);
              const bookCount = catCounts[cat.name] || 0;

              return (
                <li key={cat.categoryId || cat.name}>
                  <label className="flex items-center justify-between px-2 py-2 rounded hover:bg-sky-50 cursor-pointer">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCategoryToggle(cat.name)}
                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className={`text-sm ${isSelected ? "text-sky-700 font-medium" : "text-gray-700"}`}>
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">({bookCount})</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Selected categories summary */}
      {selectedCategories.length > 0 && (
        <div className="p-3 bg-sky-50 rounded-lg">
          <h4 className="text-sm font-medium text-sky-800 mb-2">Selected Categories:</h4>
          <div className="space-y-1">
            {selectedCategories.map(category => (
              <div key={category} className="text-xs text-sky-600 bg-white px-2 py-1 rounded">
                {category}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}