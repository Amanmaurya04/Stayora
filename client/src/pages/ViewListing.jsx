import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/authContext";

import { getListingById } from "../services/listingServices";
import {
    getListingReviews,
    createReview,
    editReview,
} from "../services/reviewServices";

import { createBooking } from "../services/bookingServices";

import {
    createPaymentOrder,
    verifyPayment,
} from "../services/paymentServices";

import "../css/viewListing.css";

const formatPrice = (price) =>
    Number(price || 0).toLocaleString("en-IN");

const getToday = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getNight = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) {
        return 0;
    }

    const startDate = new Date(`${checkIn}T00:00:00`);
    const endDate = new Date(`${checkOut}T00:00:00`);

    return Math.max(
        0,
        Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
    );
};

const RATING_CATEGORIES = [
    { key: "cleanliness", label: "Cleanliness", short: "Cleanliness" },
    { key: "accuracy", label: "Accuracy", short: "Accuracy" },
    { key: "checkIn", label: "Check-in", short: "Check-in" },
    { key: "communication", label: "Communication", short: "Communication" },
    { key: "location", label: "Location", short: "Location" },
    { key: "value", label: "Value for money", short: "Value" },
];

const EMPTY_RATINGS = {
    cleanliness: 0,
    accuracy: 0,
    checkIn: 0,
    communication: 0,
    location: 0,
    value: 0,
};

const isValidRatings = (ratings) =>
    !Object.values(ratings).some(
        (rating) => rating < 1 || rating > 5
    );

const RatingInputs = ({ values, onChange }) =>
    RATING_CATEGORIES.map(({ key, label }) => (
        <div className="rating-row" key={key}>
            <span>{label}</span>

            <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={
                            star <= values[key]
                                ? "rating-star active"
                                : "rating-star"
                        }
                        onClick={() => onChange(key, star)}
                        aria-label={`${star} stars for ${label}`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    ));

const ViewListing = () => {
    const { listingId } = useParams();
    const { user } = useAuth();

    const navigate = useNavigate();
    const [listing, setListing] = useState(null);

    const currentUserId = user?.id || user?._id;

    const hostId = listing?.host?._id || listing?.host?.id || listing?.host;

    const isOwner = Boolean(currentUserId) && Boolean(hostId) && String(currentUserId) === String(hostId)


    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);


    const [ratings, setRatings] = useState(EMPTY_RATINGS);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewMessage, setReviewMessage] = useState("");


    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editRatings, setEditRatings] = useState(EMPTY_RATINGS);
    const [editComment, setEditComment] = useState("");
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedImage, setSelectedImage] = useState(0);
    const [showAllPhotos, setShowAllPhotos] = useState(false);


    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");

    const [guest, setGuest] = useState(1);

    const [copied, setCopied] = useState(false);

    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [bookingMessage, setBookingMessage] = useState("");


    const fetchListings = async (id) => {
        try {
            setLoading(true);
            setError("");
            setListing(null);
            setSelectedImage(0);

            const { data } = await getListingById(id);

            setListing(data);
        } catch (error) {
            console.error("Fetch listing error", error);

            setError(
                error.response?.data?.message ||
                "We couldn't load this property. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const refreshListing = async (id) => {
        try {
            const { data } = await getListingById(id);
            setListing(data);
        } catch (error) {
            console.error("Refresh listing error", error);
        }
    };


    const fetchReviews = async (id) => {
        try {
            setReviewsLoading(true);

            const { data } = await getListingReviews(id);

            setReviews(
                Array.isArray(data.reviews)
                    ? data.reviews
                    : []
            );
        } catch (error) {
            console.error(
                "Error fetching reviews:",
                error.response?.data || error.message
            );

            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    };

    const refreshAfterReviewChange = async (id) => {
        try {
            const { data } = await getListingReviews(id);

            setReviews(
                Array.isArray(data.reviews)
                    ? data.reviews
                    : []
            );
        } catch (error) {
            console.error("Refresh reviews error", error);
        }

        await refreshListing(id);
    };


    const handleRatingChange = (category, value) => {
        setRatings((previous) => ({
            ...previous,
            [category]: value,
        }));

        setReviewError("");
        setReviewMessage("");
    };

    const handleCreateReview = async (e) => {
        e.preventDefault();

        setReviewError("");
        setReviewMessage("");

        if (!isValidRatings(ratings)) {
            setReviewError("Please rate all six categories.");
            return;
        }

        if (!reviewComment.trim()) {
            setReviewError("Please write a review.");
            return;
        }

        try {
            setReviewLoading(true);

            await createReview(listingId, {
                ratings,
                comment: reviewComment.trim(),
            });

            setReviewMessage("Review submitted successfully!");

            setRatings(EMPTY_RATINGS);
            setReviewComment("");

            await refreshAfterReviewChange(listingId);
        } catch (error) {
            console.error("Create review error:", error);

            setReviewError(
                error.response?.data?.message ||
                "Failed to submit review."
            );
        } finally {
            setReviewLoading(false);
        }
    };


    const handleEditClick = (review) => {
        setEditingReviewId(review._id);

        setEditRatings({
            cleanliness: review.ratings?.cleanliness || 0,
            accuracy: review.ratings?.accuracy || 0,
            checkIn: review.ratings?.checkIn || 0,
            communication: review.ratings?.communication || 0,
            location: review.ratings?.location || 0,
            value: review.ratings?.value || 0,
        });

        setEditComment(review.comment || "");
        setEditError("");
    };

    const handleEditRatingChange = (category, value) => {
        setEditRatings((previous) => ({
            ...previous,
            [category]: value,
        }));

        setEditError("");
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();

        setEditError("");

        if (!isValidRatings(editRatings)) {
            setEditError("Please rate all six categories.");
            return;
        }

        if (!editComment.trim()) {
            setEditError("Please write a review.");
            return;
        }

        try {
            setEditLoading(true);

            await editReview(editingReviewId, {
                ratings: editRatings,
                comment: editComment.trim(),
            });

            setEditingReviewId(null);
            setEditRatings(EMPTY_RATINGS);
            setEditComment("");

            await refreshAfterReviewChange(listingId);
        } catch (error) {
            console.error("Edit review error:", error);

            setEditError(
                error.response?.data?.message ||
                "Failed to update review."
            );
        } finally {
            setEditLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
        setEditRatings(EMPTY_RATINGS);
        setEditComment("");
        setEditError("");
    };


    const handleBooking = async () => {
        try {
            setBookingLoading(true);
            setBookingError("");
            setBookingMessage("");


            if (!checkIn || !checkOut) {
                setBookingError(
                    "Please select both check-in and check-out dates."
                );
                return;
            }

            if (new Date(checkIn) >= new Date(checkOut)) {
                setBookingError("Check-out must be after check-in.");
                return;
            }


            if (
                !Number.isInteger(Number(guest)) ||
                Number(guest) < 1 ||
                Number(guest) > listing.maxGuest
            ) {
                setBookingError(
                    "Please select a valid number of guests."
                );
                return;
            }


            if (!window.Razorpay) {
                throw new Error(
                    "Payment checkout could not load. Please refresh the page."
                );
            }


            const bookingResponse = await createBooking({
                listingId,
                checkIn,
                checkOut,
                guests: Number(guest),
            });

            const booking = bookingResponse.data.booking;

            if (!booking?._id) {
                throw new Error("The booking ID was not returned.");
            }


            const orderResponse = await createPaymentOrder(booking._id);

            const order = orderResponse.data;


            const options = {
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: "Stayora",
                description: `Booking for ${listing.title}`,
                order_id: order.orderId,

                handler: async (response) => {
                    try {

                        await verifyPayment({
                            bookingId: booking._id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        setBookingError("");
                        setBookingMessage(
                            "Payment verified! Your booking is confirmed."
                        );
                    } catch (error) {
                        console.error(
                            "Payment verification error:",
                            error
                        );

                        setBookingMessage("");
                        setBookingError(
                            "Payment was submitted, but verification could not be completed. Check My Bookings before retrying payment."
                        );
                    }
                },

                modal: {
                    ondismiss: () => {
                        setBookingMessage(
                            "Checkout closed. Your booking may still be pending payment."
                        );
                    },
                },

                theme: {
                    color: "#222222",
                },
            };

            const checkout = new window.Razorpay(options);

            checkout.on("payment.failed", (response) => {
                setBookingError(
                    response.error?.description ||
                    "Payment failed. Please try again."
                );
            });

            checkout.open();
        } catch (error) {
            console.error("Booking error:", error);

            setBookingError(
                error.response?.data?.message ||
                error.message ||
                "Unable to start your booking. Please try again."
            );
        } finally {
            setBookingLoading(false);
        }
    };


    useEffect(() => {
        if (!listingId) {
            setError("Listing id is missing");

            setLoading(false);
            setReviewsLoading(false);

            return;
        }

        fetchListings(listingId);
        fetchReviews(listingId);
    }, [listingId]);


    useEffect(() => {
        if (!showAllPhotos) return;

        const count = listing?.images?.filter(Boolean).length || 0;

        const onKey = (e) => {
            if (e.key === "Escape") {
                setShowAllPhotos(false);
            }

            if (e.key === "ArrowRight") {
                setSelectedImage((p) => Math.min(p + 1, count - 1));
            }

            if (e.key === "ArrowLeft") {
                setSelectedImage((p) => Math.max(p - 1, 0));
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
        };
    }, [showAllPhotos, listing]);


    const nights = getNight(checkIn, checkOut);

    const pricePerNight = Number(listing?.pricePerNight || 0);

    const subTotal = pricePerNight * nights;

    const totalPrice = subTotal;


    const images = Array.isArray(listing?.images)
        ? listing.images.filter(Boolean)
        : [];


    const location = listing?.location || {};

    const fullLocation = [
        location.address,
        location.city,
        location.state,
        location.country,
    ]
        .filter(Boolean)
        .join(", ");


    const handleShare = async () => {
        const url = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: listing?.title,
                    url,
                });
            } else {
                await navigator.clipboard.writeText(url);

                setCopied(true);

                setTimeout(() => {
                    setCopied(false);
                }, 2000);
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Error sharing listing", error);
            }
        }
    };


    if (loading) {
        return (
            <div className="status">
                <div className="d-flex justify-content-center align-items-center">
                    <div
                        className="spinner-border text-secondary"
                        role="status"
                    >
                        <span className="visually-hidden">
                            Loading...
                        </span>
                    </div>

                    <p>Loading this stay...</p>
                </div>
            </div>
        );
    }


    if (error || !listing) {
        return (
            <div className="status">
                <div>
                    <p>
                        {error || "This listing may have been removed."}
                    </p>

                    <Link to="/listings" className="vl-primary-btn">
                        Back to listings
                    </Link>
                </div>
            </div>
        );
    }


    return (
        <div className="page">
            <main className="container">


                <div className="top-bar">
                    <Link to="/listings" className="back-btn">
                        ← Back to listings
                    </Link>

                    <div className="share-box">
                        <button
                            type="button"
                            onClick={handleShare}
                            className="share-btn"
                        >
                            ↗ {copied ? "Copied" : "Share"}
                        </button>

                        {isOwner && (
                            <button
                                type="button"
                                className="share-btn"
                                onClick={() =>
                                    navigate(`/listings/${listing._id}/edit`)
                                }

                            >
                                Edit
                            </button>
                        )}

                    </div>
                </div>


                <section className="l-heading">
                    <div>
                        <h1 className="l-title">{listing.title}</h1>

                        <div className="l-meta">
                            {Number(listing.avgRating) > 0 && (
                                <>
                                    <span>
                                        ★ {Number(listing.avgRating).toFixed(1)}
                                    </span>
                                    <span>·</span>
                                </>
                            )}

                            {listing.reviewCount > 0 && (
                                <>
                                    <span>
                                        {listing.reviewCount}{" "}
                                        {listing.reviewCount > 1
                                            ? "reviews"
                                            : "review"}
                                    </span>
                                    <span>·</span>
                                </>
                            )}

                            <span>
                                {[location.city, location.state]
                                    .filter(Boolean)
                                    .join(", ")}
                            </span>
                        </div>
                    </div>
                </section>


                {images.length > 0 ? (
                    <section className="gallery">


                        <div className="gallery-main">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAllPhotos(true);
                                }}
                            >
                                <img
                                    src={images[selectedImage] || images[0]}
                                    alt={listing.title}
                                />

                                {images.length > 1 && (
                                    <span className="photo-count">
                                        Show all {images.length} photos
                                    </span>
                                )}
                            </button>
                        </div>


                        <div className="gallery-side">
                            {images.slice(1, 5).map((image, index) => (
                                <button
                                    type="button"
                                    key={`${image}-${index}`}
                                    onClick={() => {
                                        setSelectedImage(index + 1);
                                        setShowAllPhotos(true);
                                    }}
                                >
                                    <img
                                        src={image}
                                        alt={`${listing.title} ${index + 2}`}
                                    />
                                </button>
                            ))}


                            {images.length > 1 && (
                                <button
                                    type="button"
                                    className="see-all"
                                    onClick={() => {
                                        setSelectedImage(0);
                                        setShowAllPhotos(true);
                                    }}
                                >
                                    View all photos
                                </button>
                            )}
                        </div>
                    </section>
                ) : (
                    <div className="no-image">No images available</div>
                )}


                <div className="content-grid">

                    <div className="main-column">


                        <section className="l-section">
                            <div className="property-heading">
                                <div>
                                    <h2>
                                        {listing.propertyType} in{" "}
                                        {location.city || "this location"}
                                    </h2>

                                    <p>
                                        {listing.roomType}
                                        {" · "}
                                        {listing.maxGuest}{" "}
                                        {listing.maxGuest === 1
                                            ? "guest"
                                            : "guests"}
                                        {" · "}
                                        {listing.bedrooms}{" "}
                                        {listing.bedrooms === 1
                                            ? "bedroom"
                                            : "bedrooms"}
                                    </p>
                                </div>
                            </div>
                        </section>


                        <section className="l-section">
                            <h2>About this place</h2>

                            <p className="l-description">
                                {listing.description}
                            </p>
                        </section>


                        <section className="l-section">
                            <h2>What this place offers</h2>

                            {Array.isArray(listing.amenities) &&
                                listing.amenities.length > 0 ? (
                                <div className="l-amenities">
                                    {listing.amenities.map((amenity, index) => (
                                        <div
                                            className="l-amenity"
                                            key={`${amenity}-${index}`}
                                        >
                                            <span>✓</span>
                                            <span>{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="vl-muted">
                                    No amenities listed.
                                </p>
                            )}
                        </section>


                        <section className="l-section">
                            <h2>Where you'll be</h2>

                            <div className="location-box d-flex">
                                <div className="location-icon d-flex justify-content-center align-items-center">
                                    📍
                                </div>

                                <div>
                                    <strong>
                                        {location.city}
                                        {location.state
                                            ? `, ${location.state}`
                                            : ""}
                                    </strong>

                                    <p>{fullLocation}</p>
                                </div>
                            </div>
                        </section>


                        <section className="l-section">
                            <h2>House rules</h2>

                            {Array.isArray(listing.houseRules) &&
                                listing.houseRules.length > 0 ? (
                                <div className="l-rules">
                                    {listing.houseRules.map((rule, index) => (
                                        <div
                                            className="l-rule"
                                            key={`${rule}-${index}`}
                                        >
                                            <span>•</span>
                                            <span>{rule}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="l-muted">
                                    No house rules listed.
                                </p>
                            )}
                        </section>


                        <section className="l-section vl-reviews-section">
                            <div className="l-reviews-heading">
                                <h2>
                                    {Number(listing.avgRating) > 0
                                        ? `★ ${Number(listing.avgRating).toFixed(1)}`
                                        : "Reviews"}

                                    {Number(listing.reviewCount) > 0 && (
                                        <>
                                            {" · "}
                                            {listing.reviewCount}{" "}
                                            {listing.reviewCount === 1
                                                ? "review"
                                                : "reviews"}
                                        </>
                                    )}
                                </h2>
                            </div>

                            {reviewsLoading ? (


                                <div className="reviews-loading">
                                    <div
                                        className="spinner-border text-secondary"
                                        role="status"
                                    />

                                    <p>Loading reviews...</p>
                                </div>

                            ) : reviews.length === 0 ? (


                                <div className="no-reviews">
                                    <h3>No reviews yet</h3>
                                    <p>Be the first one to review</p>
                                </div>

                            ) : (


                                <div className="review-grid">
                                    {reviews.map((review) => {
                                        const isOwner =
                                            Boolean(currentUserId) &&
                                            Boolean(review.guest?._id) &&
                                            String(review.guest._id) ===
                                            String(currentUserId);

                                        return (
                                            <article
                                                key={review._id}
                                                className="vl-review-card"
                                            >
                                                {editingReviewId === review._id ? (


                                                    <form onSubmit={handleSaveEdit}>
                                                        <h3>Edit your review</h3>

                                                        <RatingInputs
                                                            values={editRatings}
                                                            onChange={handleEditRatingChange}
                                                        />

                                                        <label
                                                            htmlFor={`editReviewComment-${review._id}`}
                                                        >
                                                            Your experience
                                                        </label>

                                                        <textarea
                                                            id={`editReviewComment-${review._id}`}
                                                            value={editComment}
                                                            onChange={(e) =>
                                                                setEditComment(e.target.value)
                                                            }
                                                            maxLength={2000}
                                                            rows={5}
                                                        />

                                                        {editError && (
                                                            <p className="review-error">
                                                                {editError}
                                                            </p>
                                                        )}

                                                        <div>
                                                            <button
                                                                type="submit"
                                                                disabled={editLoading}
                                                            >
                                                                {editLoading
                                                                    ? "Saving..."
                                                                    : "Save Changes"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={handleCancelEdit}
                                                                disabled={editLoading}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </form>

                                                ) : (


                                                    <>

                                                        <div className="vl-review-user">
                                                            <div className="vl-review-avatar">
                                                                {(review.guest?.username || "G")
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div className="vl-review-user-info">
                                                                <h3>
                                                                    {review.guest?.username ||
                                                                        "Guest"}
                                                                </h3>

                                                                <p>
                                                                    {review.createdAt
                                                                        ? new Date(
                                                                            review.createdAt
                                                                        ).toLocaleDateString(
                                                                            "en-IN",
                                                                            {
                                                                                month: "long",
                                                                                year: "numeric",
                                                                            }
                                                                        )
                                                                        : ""}
                                                                </p>
                                                            </div>
                                                        </div>


                                                        <div className="vl-review-ratings">
                                                            {RATING_CATEGORIES.map(
                                                                ({ key, short }) => (
                                                                    <div
                                                                        key={key}
                                                                        className="vl-rating-category"
                                                                    >
                                                                        <span>{short}</span>

                                                                        <strong>
                                                                            {review.ratings?.[key] ?? "—"}{" "}
                                                                            / 5
                                                                        </strong>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>


                                                        <div className="vl-review-rating">
                                                            <span>
                                                                {"★".repeat(
                                                                    Math.max(
                                                                        0,
                                                                        Math.min(
                                                                            5,
                                                                            Math.round(
                                                                                review.overallRating || 0
                                                                            )
                                                                        )
                                                                    )
                                                                )}
                                                            </span>

                                                            <strong>
                                                                {Number(
                                                                    review.overallRating || 0
                                                                ).toFixed(1)}
                                                            </strong>
                                                        </div>


                                                        <p className="vl-review-comment">
                                                            {review.comment}
                                                        </p>


                                                        {isOwner && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleEditClick(review)
                                                                }
                                                            >
                                                                Edit
                                                            </button>
                                                        )}


                                                        {review.hostReply?.text && (
                                                            <div className="vl-host-reply">
                                                                <strong>
                                                                    Response from host
                                                                </strong>

                                                                <p>{review.hostReply.text}</p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>


                        <section className="create-review">
                            <h2>Write a Review</h2>

                            <form onSubmit={handleCreateReview}>
                                <RatingInputs
                                    values={ratings}
                                    onChange={handleRatingChange}
                                />

                                <label htmlFor="reviewComment">
                                    Your experience
                                </label>

                                <textarea
                                    id="reviewComment"
                                    value={reviewComment}
                                    onChange={(e) =>
                                        setReviewComment(e.target.value)
                                    }
                                    placeholder="Tell others about your stay..."
                                    maxLength={2000}
                                    rows={5}
                                    required
                                />

                                {reviewError && (
                                    <p className="review-error">
                                        {reviewError}
                                    </p>
                                )}

                                {reviewMessage && (
                                    <p className="review-success">
                                        {reviewMessage}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={reviewLoading}
                                >
                                    {reviewLoading
                                        ? "Submitting..."
                                        : "Submit Review"}
                                </button>
                            </form>
                        </section>

                    </div>


                    <aside className="booking-card">

                        <div className="booking-price">
                            <strong>₹{formatPrice(pricePerNight)}</strong>
                            <span> / night</span>
                        </div>

                        <div className="booking-fields">

                            <label>
                                Check-in

                                <input
                                    type="date"
                                    value={checkIn}
                                    min={getToday()}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        setCheckIn(value);

                                        if (checkOut && value >= checkOut) {
                                            setCheckOut("");
                                        }

                                        setBookingError("");
                                        setBookingMessage("");
                                    }}
                                    required
                                />
                            </label>

                            <label>
                                Check-out

                                <input
                                    type="date"
                                    value={checkOut}
                                    min={checkIn || getToday()}
                                    onChange={(e) => {
                                        setCheckOut(e.target.value);

                                        setBookingError("");
                                        setBookingMessage("");
                                    }}
                                    required
                                />
                            </label>

                            <label>
                                Guests

                                <select
                                    value={guest}
                                    onChange={(e) => {
                                        setGuest(Number(e.target.value));

                                        setBookingError("");
                                    }}
                                >
                                    {Array.from(
                                        {
                                            length: Math.max(
                                                0,
                                                Number(listing.maxGuest) || 0
                                            ),
                                        },
                                        (_, index) => index + 1
                                    ).map((count) => (
                                        <option key={count} value={count}>
                                            {count}{" "}
                                            {count === 1 ? "guest" : "guests"}
                                        </option>
                                    ))}
                                </select>
                            </label>

                        </div>

                        {nights > 0 && (
                            <div className="booking-breakdown">
                                <p>
                                    ₹{formatPrice(pricePerNight)} × {nights}{" "}
                                    {nights === 1 ? "night" : "nights"}

                                    <span>₹{formatPrice(subTotal)}</span>
                                </p>

                                <hr />

                                <p className="booking-total">
                                    Total

                                    <strong>₹{formatPrice(totalPrice)}</strong>
                                </p>
                            </div>
                        )}

                        {bookingError && (
                            <p className="booking-error" role="alert">
                                {bookingError}
                            </p>
                        )}

                        {bookingMessage && (
                            <p className="booking-message" role="status">
                                {bookingMessage}
                            </p>
                        )}

                        <button
                            type="button"
                            className="vl-primary-btn booking-submit"
                            onClick={handleBooking}
                            disabled={bookingLoading}
                        >
                            {bookingLoading ? "Processing..." : "Reserve"}
                        </button>

                        <p className="booking-note">
                            You won't be charged until you proceed with payment.
                        </p>

                    </aside>

                </div>


                <section className="vl-section">
                    <h2>Meet your host</h2>

                    <div className="vl-host-card">
                        <div className="vl-host-avatar">
                            {(listing.host?.username || "H")
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <h3>{listing.host?.username || "Host"}</h3>

                            <p>
                                Your host is here to help make your stay
                                comfortable.
                            </p>
                        </div>
                    </div>
                </section>


                {showAllPhotos && images.length > 0 && (
                    <div
                        className="vl-photo-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="All photos"
                    >
                        <div className="vl-photo-modal-header">
                            <button
                                type="button"
                                onClick={() => setShowAllPhotos(false)}
                                aria-label="Close photos"
                            >
                                ✕
                            </button>

                            <span>
                                {selectedImage + 1} / {images.length}
                            </span>
                        </div>

                        <div className="vl-photo-modal-body">
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedImage((p) => Math.max(p - 1, 0))
                                }
                                disabled={selectedImage === 0}
                                aria-label="Previous photo"
                            >
                                ‹
                            </button>

                            <img
                                src={images[selectedImage] || images[0]}
                                alt={`${listing.title} ${selectedImage + 1}`}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedImage((p) =>
                                        Math.min(p + 1, images.length - 1)
                                    )
                                }
                                disabled={selectedImage === images.length - 1}
                                aria-label="Next photo"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default ViewListing; 
