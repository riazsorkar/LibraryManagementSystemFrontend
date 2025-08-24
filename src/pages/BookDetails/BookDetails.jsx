import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  Star,
  PlayCircle,
  PauseCircle,
  Download,
  X,
  ThumbsUp,
  ThumbsDown,
  Plus,
} from "lucide-react";
import Slider from "../../components/Slider/Slider";
import api from "../../api";
import normalizeBookData from "../../components/NormalizeBookData/NormalizeBookData";

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [bookData, setBookData] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [ratingsData, setRatingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [toast, setToast] = useState({ open: false, msg: "" });

  // Spec & Summary state
  const [pdTab, setPdTab] = useState("summary");
  const [pdExpanded, setPdExpanded] = useState(false);
  const specRef = useRef(null);

  // Audio player state & refs
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Helpful/Not Helpful votes
  const [votes, setVotes] = useState({});
  const [bump, setBump] = useState({});
  const [expanded, setExpanded] = useState({});

  // Fetch book data and ratings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch book details
        const bookResponse = await api.get(`/Books/${id}`);
        const normalizedBook = normalizeBookData(bookResponse.data);
        setBookData(normalizedBook);

        // Fetch related books (same category)
        const allBooksResponse = await api.get("/Books");
        const related = allBooksResponse.data
          .filter(b => b.bookId !== parseInt(id) && b.categoryName === normalizedBook.category)
          .slice(0, 3)
          .map(normalizeBookData);
        setRelatedBooks(related);

        // Fetch ratings
        setLoadingRatings(true);
        const ratingsResponse = await api.get(`/Ratings/book/${id}`);
        setRatingsData(ratingsResponse.data);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setLoadingRatings(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle rating submission
  const handleSubmitRating = async () => {
    try {
      await api.post("/Ratings", {
        rating: userRating,
        review: userReview,
        bookId: parseInt(id)
      });
      
      // Refresh ratings data
      const ratingsResponse = await api.get(`/Ratings/book/${id}`);
      setRatingsData(ratingsResponse.data);
      
      setShowRatingModal(false);
      setUserRating(0);
      setUserReview("");
      
      setToast({ open: true, msg: "Rating submitted successfully!" });
      setTimeout(() => setToast({ open: false, msg: "" }), 3000);
    } catch (error) {
      console.error("Error submitting rating:", error);
      setToast({ open: true, msg: "Failed to submit rating. Please try again." });
      setTimeout(() => setToast({ open: false, msg: "" }), 3000);
    }
  };

  // Audio player functions
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => setDuration(el.duration || 0);
    const onTime = () => setCurTime(el.currentTime || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurTime(0);
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [bookData?.audioSrc]);

  useEffect(() => {
    setIsPlaying(false);
    setCurTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = bookData?.audioSrc || "";
      if (bookData?.audioSrc) audioRef.current.load();
    }
  }, [bookData?.audioSrc]);

  const toggleAudio = () => {
    const el = audioRef.current;
    if (!el || !bookData?.audioSrc) return;

    const want = new URL(bookData.audioSrc, window.location.href).href;
    if (el.src !== want) {
      el.src = bookData.audioSrc;
    }

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      if (Number.isNaN(el.duration) || !el.duration) {
        el.load();
      }
      el.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio play() failed:", err?.message || err);
          setIsPlaying(false);
        });
    }
  };

  const format = (sec = 0) => {
    if (!isFinite(sec)) return "0:00";
    const s = Math.floor(sec % 60);
    const m = Math.floor(sec / 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progress = duration ? Math.min(1, Math.max(0, curTime / duration)) : 0;

  const onSeekClick = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setCurTime(pct * duration);
  };

  // Helper functions
  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < (rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
      />
    ));

  const renderStarsLarge = (val) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < Math.round(val || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
      />
    ));

  const vote = (ratingId, dir) => {
    const cur = votes[ratingId] || { up: 0, down: 0, my: null };
    let { up, down, my } = cur;

    if (dir === "up") {
      if (my === "up") {
        up -= 1;
        my = null;
      } else {
        if (my === "down") down -= 1;
        up += 1;
        my = "up";
      }
    } else {
      if (my === "down") {
        down -= 1;
        my = null;
      } else {
        if (my === "up") up -= 1;
        down += 1;
        my = "down";
      }
    }

    const next = { up: Math.max(0, up), down: Math.max(0, down), my };
    setVotes((prev) => ({ ...prev, [ratingId]: next }));

    setBump((p) => ({ ...p, [ratingId]: { ...(p[ratingId] || {}), [dir]: true } }));
    setTimeout(() => {
      setBump((p) => ({ ...p, [ratingId]: { ...(p[ratingId] || {}), [dir]: false } }));
    }, 220);
  };

  if (loading) {
    return (
      <div className="text-center text-gray-600 py-20">
        Loading book details...
      </div>
    );
  }

  if (!bookData) {
    return (
      <div className="text-center text-gray-600 py-20">
        Book not found
      </div>
    );
  }

  const ratingCountDisplay = ratingsData?.totalRatings || 0;
  const reviewsTextDisplay = ratingsData?.recentReviews?.length > 0 
    ? `${ratingsData.recentReviews.length} Reviews` 
    : "No Reviews";

  return (
    <div className="bg-white py-10 px-4 sm:px-6 lg:px-8">
      {/* Page grid */}
      <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)]">
        
        {/* LEFT COLUMN (cover) */}
        <div className="lg:col-span-1 flex flex-col items-center">
          <div className="w-[340px] max-w-full border border-gray-300 rounded-md p-4 bg-white">
            <img
              src={bookData.coverImage}
              alt={bookData.title}
              className="w-full h-[460px] object-contain"
            />
          </div>
        </div>

        {/* RIGHT COLUMN (book info) */}
        <div className="lg:col-span-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{bookData.title}</h1>
          <p className="text-gray-600 mt-1 text-base">
            by <span className="text-sky-600 font-medium">{bookData.authors}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {bookData.publisher}, {bookData.publishDate} —{" "}
            <Link
              to="/all-genres"
              state={{ filter: { type: "category", value: bookData.category } }}
              className="text-sky-600 hover:underline"
            >
              {bookData.category}
            </Link>
          </p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {renderStars(ratingsData?.averageRating || 0)}
            <span className="text-sm text-gray-600 font-semibold">{ratingCountDisplay} Ratings</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-500">{reviewsTextDisplay}</span>
          </div>

          {/* Short summary teaser */}
          <div className="mt-6">
            <h3 className="font-bold text-gray-800">Summary of the Book</h3>
            <p className="text-sm text-gray-700 mt-2 leading-relaxed whitespace-pre-line">
              {bookData.summary?.split(".")[0] + (bookData.summary ? "..." : "")}
              {bookData.summary?.split(".").length > 1 && (
                <button
                  onClick={() => {
                    setPdTab("summary");
                    setPdExpanded(false);
                    specRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="ml-2 font-semibold hover:underline text-sky-600"
                >
                  Read More
                </button>
              )}
            </p>
          </div>

          {/* Availability + Audio + PDF */}
          <div className="mt-6">
            <span className="text-green-600 font-medium text-sm inline-flex items-center">
              <span className="h-3 w-3 bg-green-500 rounded-full animate-ping mr-2"></span>
              {bookData.status}
            </span>

            {/* Audio row */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleAudio}
                disabled={!bookData.audioSrc}
                className={`flex items-center gap-2 text-sm ${
                  bookData.audioSrc
                    ? "text-gray-700 hover:text-sky-600"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
              >
                {isPlaying ? (
                  <PauseCircle className="w-5 h-5" />
                ) : (
                  <PlayCircle className="w-5 h-5" />
                )}
                <span>Audio Clip</span>
              </button>

              {/* Progress bar */}
              <div
                className="w-40 sm:w-56 h-1 bg-gray-200 rounded-full mx-2 sm:mx-3 relative cursor-pointer select-none"
                onClick={onSeekClick}
                role="slider"
                tabIndex={0}
                aria-valuemin={0}
                aria-valuemax={Math.max(1, Math.floor(duration))}
                aria-valuenow={Math.floor(curTime)}
                aria-label="Seek audio"
              >
                <div
                  className="absolute left-0 top-0 h-full bg-sky-500 rounded-full"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>

              {/* Timing */}
              <div className="text-xs text-gray-600 min-w-[84px]">
                {format(curTime)} / {format(duration)}
              </div>

              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={bookData.audioSrc || undefined}
                preload="auto"
                crossOrigin="anonymous"
              />

              <a
                href={bookData.pdfLink}
                download
                className="ml-auto inline-flex items-center gap-1 text-sm text-gray-700 font-semibold border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                PDF
              </a>
            </div>

            {!bookData.audioSrc && (
              <div className="mt-2 text-xs text-gray-500">
                No audio clip provided for this book.
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                const stored = JSON.parse(localStorage.getItem("borrowedBooks")) || [];
                const alreadyExists = stored.find((b) => b.id === bookData.id);
                if (!alreadyExists) {
                  stored.push({ ...bookData, quantity: 1 });
                  localStorage.setItem("borrowedBooks", JSON.stringify(stored));
                }
                navigate((`/fill-up-form/${bookData.id}`));
              }}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-md w-full sm:w-auto block text-center"
            >
              Borrow
            </button>
          </div>
        </div>

        {/* ============== SPECIFICATION & SUMMARY ============== */}
        <div ref={specRef} className="lg:col-span-2">
          <div className="mt-10 rounded-lg border border-gray-300 overflow-hidden bg-white">
            <div className="px-4 py-3">
              <h3 className="text-lg font-bold text-gray-800">Specification & Summary</h3>
            </div>

            <div className="border-t border-gray-300">
              <div className="px-4 pt-3">
                <div className="flex items-center gap-2">
                  {["summary", "spec"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setPdTab(t)}
                      className={`px-3 py-1.5 text-sm rounded-md border ${
                        pdTab === t
                          ? "bg-green-100 border-green-300 text-green-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {t === "summary" ? "Summary" : "Specification"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4">
                {pdTab === "summary" && (
                  <>
                    {!pdExpanded ? (
                      <>
                        <div className="text-gray-800 text-[15px] leading-7 space-y-4">
                          <p className="line-clamp-6">{bookData.summary}</p>
                        </div>

                        {bookData.summary && bookData.summary.length > 300 && (
                          <div className="mt-4 flex justify-center">
                            <button
                              onClick={() => setPdExpanded(true)}
                              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50"
                            >
                              Show More
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-gray-800 text-[15px] leading-7 whitespace-pre-line">
                          {bookData.summary}
                        </div>
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={() => setPdExpanded(false)}
                            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Show Less
                          </button>
                        </div>
                      </>
                    )}

                    <div className="mt-4 border-t border-b border-gray-300 py-3">
                      <div className="text-center">
                        <button className="inline-flex items-center gap-2 text-red-500 hover:text-sky-600 text-sm">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-current">
                            <span className="text-[10px] font-bold">i</span>
                          </span>
                          Report incorrect information
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {pdTab === "spec" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div className="flex justify-between sm:block">
                      <span className="text-gray-500">Title</span>
                      <div className="font-medium text-gray-800">{bookData.title}</div>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-gray-500">Author</span>
                      <div className="font-medium text-gray-800">{bookData.authors}</div>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-gray-500">Category</span>
                      <div className="font-medium text-gray-800">{bookData.category}</div>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-gray-500">Publisher</span>
                      <div className="font-medium text-gray-800">{bookData.publisher}</div>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-gray-500">Publish Date</span>
                      <div className="font-medium text-gray-800">{bookData.publishDate || "—"}</div>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-gray-500">Rating</span>
                      <div className="font-medium text-gray-800">
                        {(ratingsData?.averageRating || 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-gray-500">Status</span>
                      <div className="font-medium text-gray-800">{bookData.status}</div>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-gray-500">Available Copies</span>
                      <div className="font-medium text-gray-800">{bookData.availableCopies}</div>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-gray-500">Total Copies</span>
                      <div className="font-medium text-gray-800">{bookData.totalCopies}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== REVIEWS & RATINGS ===== */}
        <div className="lg:col-span-2 mt-10">
          <h3 className="text-2xl font-semibold text-gray-900">Reviews and Ratings</h3>
        </div>

        {/* LEFT SIDE: rate + reviews list */}
        <div className="lg:col-span-1">
          <div className="">
            <div className="text-sm text-gray-700 font-semibold">Rate this product</div>
            <div className="mt-2 flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-6 h-6 cursor-pointer ${i < userRating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                  onClick={() => setUserRating(i + 1)}
                />
              ))}
            </div>
            <button 
              onClick={() => setShowRatingModal(true)}
              className="mt-3 inline-flex items-center border border-gray-300 text-sky-600 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-sky-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Write Review
            </button>
          </div>

          {loadingRatings ? (
            <div className="text-sm text-gray-500 mt-6">Loading reviews...</div>
          ) : !ratingsData || ratingsData.recentReviews?.length === 0 ? (
            <div className="text-sm text-gray-500 mt-6">No reviews yet for this book.</div>
          ) : (
            <div className="space-y-6 mt-6">
              {ratingsData.recentReviews.map((review) => {
                const isLong = (review.review || "").length > 220;
                const open = !!expanded[review.ratingId];
                const body = !isLong || open ? review.review : review.review.slice(0, 220) + "…";
                const firstLetter = review.username?.trim()?.[0]?.toUpperCase() || "?";
                const reviewDate = new Date(review.createdAt).toLocaleDateString();
                
                const v = votes[review.ratingId] || { up: 0, down: 0, my: null };

                return (
                  <article key={review.ratingId} className="border-b border-gray-300 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {firstLetter}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900">{review.username}</span>
                          <span className="text-gray-500">, {reviewDate}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                      {body}{" "}
                      {isLong && (
                        <button
                          onClick={() => setExpanded((s) => ({ ...s, [review.ratingId]: !open }))}
                          className="text-sky-600 font-medium hover:underline"
                        >
                          {open ? "Read less" : "Read More"}
                        </button>
                      )}
                    </p>

                    <div className="mt-3 text-xs text-gray-500">Was this review helpful to you?</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                      <button
                        onClick={() => vote(review.ratingId, "up")}
                        className={`inline-flex items-center gap-1 rounded border px-3 py-1 transition
                          ${v.my === "up" ? "border-green-500 text-green-700 bg-green-50" : "border-gray-300"}
                          ${bump[review.ratingId]?.up ? "animate-[popVote_.2s_ease-out]" : ""}`}
                      >
                        <ThumbsUp className="w-4 h-4" /> Helpful ({v.up})
                      </button>
                      <button
                        onClick={() => vote(review.ratingId, "down")}
                        className={`inline-flex items-center gap-1 rounded border px-3 py-1 transition
                          ${v.my === "down" ? "border-rose-500 text-rose-700 bg-rose-50" : "border-gray-300"}
                          ${bump[review.ratingId]?.down ? "animate-[popVote_.2s_ease-out]" : ""}`}
                      >
                        <ThumbsDown className="w-4 h-4" /> Not Helpful ({v.down})
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Average + bars + sort */}
        <div className="lg:col-span-1">
          {!ratingsData || ratingsData.totalRatings === 0 ? null : (
            <div className="mt-4 flex items-start gap-8">
              <div>
                <div className="text-3xl font-semibold">{ratingsData.averageRating.toFixed(1)}</div>
                <div className="mt-1 flex">{renderStarsLarge(ratingsData.averageRating)}</div>
                <div className="mt-1 text-xs text-gray-600">
                  {ratingsData.totalRatings} Ratings and {ratingsData.recentReviews.length} Reviews
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RELATED BOOKS */}
        <div className="lg:col-span-2">
          <Slider title={"Related Books"} items={relatedBooks} className="p-3 sm:p-4" />
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-100"
            onClick={() => setShowRatingModal(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-300 p-5 animate-[pop_220ms_ease-out]">
              <div className="flex items-start justify-between">
                <h4 className="text-lg font-semibold">Write a Review</h4>
                <button
                  className="p-2 hover:bg-gray-100 rounded"
                  onClick={() => setShowRatingModal(false)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700">Your Rating</div>
                <div className="mt-2 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-8 h-8 cursor-pointer ${i < userRating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                      onClick={() => setUserRating(i + 1)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Your Review</label>
                <textarea
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="Share your thoughts about this book..."
                  className="w-full mt-2 p-3 border border-gray-300 rounded-md resize-none h-32"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={userRating === 0}
                  className="px-4 py-2 rounded-md bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.open && (
        <div className="fixed left-1/2 bottom-8 -translate-x-1/2 z-[60] bg-green-600 text-white px-4 py-2 rounded-md shadow-lg animate-[toastPop_.22s_ease-out]">
          {toast.msg}
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes pop { 0% { transform: scale(.95); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes toastPop { 0% { transform: translate(-50%, 8px); opacity: 0 } 100% { transform: translate(-50%, 0); opacity: 1 } }
        @keyframes popVote { 0% { transform: scale(.96) } 60% { transform: scale(1.06) } 100% { transform: scale(1) } }
      `}</style>
    </div>
  );
}