import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import normalizeBookData from "../../components/NormalizeBookData/NormalizeBookData"; // Import your normalizer

const FeaturedBanner = () => {
  const [featured, setFeatured] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch featured books from API - FIXED ENDPOINT
  useEffect(() => {
    const fetchFeaturedBooks = async () => {
      try {
        setLoading(true);
        const res = await api.get("/FeaturedBooks");
        const normalizedBooks = res.data.map(normalizeBookData); // Use your existing normalizer
        
        setFeatured(normalizedBooks);
      } catch (err) {
        console.error("Error fetching featured books:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBooks();
  }, []);

  // Auto-slide every 5s
  useEffect(() => {
    if (featured.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featured.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featured.length]);

  if (loading) {
    return (
      <div className="bg-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="max-w-7xl w-full mx-auto text-center">
          <p>Loading featured books...</p>
        </div>
      </div>
    );
  }

  if (featured.length === 0) {
    return null; // Don't render if no books
  }

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + featured.length) % featured.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % featured.length);
  };

  const currentBook = featured[current];
  const isOutOfStock = currentBook.availableCopies < 1; // Use the normalized field

  return (
    <div className="bg-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative flex justify-center items-center">
      <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-12">
        <div className="shadow-lg rounded-md overflow-hidden w-full sm:w-64 flex-shrink-0 max-w-xs sm:max-w-none">
          <img
            src={currentBook.coverImage} // Use normalized field name
            alt={currentBook.title}
            className="w-full h-64 sm:h-[350px] object-cover"
          />
        </div>

        <div className="text-center lg:text-left px-1 sm:px-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">Featured Book</h2>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{currentBook.title}</h3>
          <p className="text-sky-600 uppercase tracking-widest text-xs mb-2">
            by {currentBook.authors} {/* Use normalized field name */}
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto lg:mx-0 mb-4">
            {currentBook.summary || "No description available"} {/* Use normalized field name */}
          </p>

          <div className="flex items-center justify-center lg:justify-start mb-4">
            <span className="relative flex h-3 w-3 mr-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOutOfStock ? "bg-red-400" : "bg-green-400"} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isOutOfStock ? "bg-red-500" : "bg-green-500"}`}></span>
            </span>
            <span className={`font-medium ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
              {isOutOfStock ? "Not Available" : "Available"} {/* Use consistent status text */}
            </span>
          </div>

          <Link
            to={`/book/${currentBook.id}`}
            className="inline-block px-5 py-2 border border-sky-600 text-sky-600 rounded hover:bg-sky-600 hover:text-white transition-all text-sm"
          >
            VIEW DETAILS →
          </Link>
        </div>
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-3 sm:left-6 top-auto sm:top-1/2 bottom-16 sm:bottom-auto -translate-y-0 sm:-translate-y-1/2 bg-white rounded-full shadow p-2 hover:bg-sky-50"
      >
        <FaChevronLeft className="text-blue-600" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 sm:right-6 top-auto sm:top-1/2 bottom-16 sm:bottom-auto -translate-y-0 sm:-translate-y-1/2 bg-white rounded-full shadow p-2 hover:bg-sky-50"
      >
        <FaChevronRight className="text-blue-600" />
      </button>

      <div className="flex justify-center mt-10 gap-2 absolute bottom-4 left-1/2 transform -translate-x-1/2">
        {featured.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full ${idx === current ? "bg-blue-600" : "bg-gray-300"}`}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedBanner;