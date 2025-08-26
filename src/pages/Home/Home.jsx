import { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";
import FeaturedBanner from "../../components/FeaturedBanner/FeaturedBanner";
import { useNavigate } from "react-router-dom";
import { Filter } from "lucide-react";
import Slider from "../../components/Slider/Slider";
import api from "../../api";
import normalizeBookData from "../../components/NormalizeBookData/NormalizeBookData";

export default function Home() {
  const [filter, setFilter] = useState({ type: "all" });
  const [openFilters, setOpenFilters] = useState(false);
  const navigate = useNavigate();
  const [recommended, setRecommended] = useState([]);
  const [popular, setPopular] = useState([]);
  const [newBookCollections, setNewBookCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [ratings, setRatings] = useState({});

  // Handle filter selection - navigate to All Genres page when filtering
  const handleFilterSelect = (newFilter) => {
    setFilter(newFilter);
    
    // If categories are selected, navigate to All Genres page with query params
    if (newFilter.type === "categories" && newFilter.categories.length > 0) {
      const categoryParams = newFilter.categories.map(cat => 
        `category=${encodeURIComponent(cat)}`
      ).join('&');
      
      navigate(`/all-genres?${categoryParams}`);
    }
  };

  // Filter books based on selected categories (for immediate feedback before navigation)
  const filterBooks = (books) => {
    if (filter.type === "all" || !filter.categories || filter.categories.length === 0) {
      return books;
    }
    
    return books.filter(book => 
      filter.categories.includes(book.categoryName)
    );
  };

  const filteredRecommended = useMemo(() => filterBooks(recommended), [recommended, filter]);
  const filteredPopular = useMemo(() => filterBooks(popular), [popular, filter]);
  const filteredNewBookCollections = useMemo(() => filterBooks(newBookCollections), [newBookCollections, filter]);

  const fetchBookData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [recommendedResponse, popularResponse, newBookCollectionsResponse] =
        await Promise.all([
          api.get("/recommendations/for-user?count=5"),
          api.get("/recommendations/popular?count=5"),
          api.get("/Books"),
        ]);

      const recommendedBooks = recommendedResponse.data.map(normalizeBookData);
      const popularBooks = popularResponse.data.map(normalizeBookData);
      const newBooks = newBookCollectionsResponse.data.map(normalizeBookData);

      // Get all unique book IDs to fetch ratings
      const allBookIds = [
        ...recommendedBooks.map(b => b.id),
        ...popularBooks.map(b => b.id),
        ...newBooks.map(b => b.id)
      ].filter((id, index, array) => array.indexOf(id) === index);

      // Fetch ratings for all books
      const ratingPromises = allBookIds.map(bookId => 
        api.get(`/Ratings/book/${bookId}`).catch(error => {
          console.warn(`Failed to fetch ratings for book ${bookId}:`, error);
          return { data: null };
        })
      );

      const ratingResponses = await Promise.all(ratingPromises);
      
      // Create ratings lookup object
      const ratingsData = {};
      ratingResponses.forEach((response, index) => {
        if (response.data) {
          ratingsData[allBookIds[index]] = {
            averageRating: response.data.averageRating || 0,
            totalRatings: response.data.totalRatings || 0
          };
        }
      });

      setRatings(ratingsData);

      // Update books with rating data
      const updateBooksWithRatings = (books) => {
        return books.map(book => ({
          ...book,
          rating: ratingsData[book.id]?.averageRating || 0,
          ratingCount: ratingsData[book.id]?.totalRatings || 0
        }));
      };

      setRecommended(updateBooksWithRatings(recommendedBooks));
      setPopular(updateBooksWithRatings(popularBooks));
      setNewBookCollections(updateBooksWithRatings(newBooks));

    } catch (error) {
      console.error("Error fetching book data:", error);
      setErrorMsg("Failed to load book data. Please try again later.\n" + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookData();
  }, []);

  if (loading) {
    return <p>Loading books...</p>;
  }

  if (errorMsg) {
    return <p className="text-red-500">{errorMsg}</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl w-full flex flex-col md:flex-row px-4 sm:px-6 lg:px-8 py-4 gap-4">
        {/* <aside className="hidden md:block w-full md:w-64 lg:w-72 flex-none md:sticky md:top-20">
          <Sidebar onSelect={handleFilterSelect} />
        </aside> */}

        <main className="flex-1 min-w-0">
          <div className="md:hidden mb-3">
            <button
              type="button"
              onClick={() => setOpenFilters(true)}
              className="inline-flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 rounded-md"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Show filter status with link to All Genres */}
          {filter.type === "categories" && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                Filtering by: {filter.categories.join(", ")}
              </p>
              <button
                onClick={() => {
                  const categoryParams = filter.categories.map(cat => 
                    `category=${encodeURIComponent(cat)}`
                  ).join('&');
                  navigate(`/all-genres?${categoryParams}`);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                View all books in these categories →
              </button>
            </div>
          )}

          <>
            <Slider
              title="Recommended"
              items={filteredRecommended}
            />
        
            <Slider
              title="Popular"
              items={filteredPopular}
            />
        
            <Slider
              title="New Book Collections"
              items={filteredNewBookCollections}
            />
          </>
        </main>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FeaturedBanner />
      </div>
    </div>
  );
}