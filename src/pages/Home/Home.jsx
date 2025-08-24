import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";
import FeaturedBanner from "../../components/FeaturedBanner/FeaturedBanner";
import { useNavigate } from "react-router-dom";
import { Filter } from "lucide-react";
import Slider from "../../components/Slider/Slider";
import api from "../../api";
import normalizeBookData from "../../components/NormalizeBookData/NormalizeBookData";

export default function Home() {
  const [filter, setFilter] = useState(null);
  const [openFilters, setOpenFilters] = useState(false);
  const navigate = useNavigate();
  const [recommended, setRecommended] = useState([]);
  const [popular, setPopular] = useState([]);
  const [newBookCollections, setNewBookCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [ratings, setRatings] = useState({}); // Store ratings by bookId

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
          return { data: null }; // Return null if rating fetch fails
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
          <Sidebar onSelect={setFilter} />
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

          <>
            <Slider
              title="Recommended"
              items={recommended}
            />
        
            <Slider
              title="Popular"
              items={popular}
            />
        
            <Slider
              title="New Book Collections"
              items={newBookCollections}
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