import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import "../css/viewExperience.css";

import { useAuth } from "../context/authContext";

import { getExperience } from "../services/experienceServices";

import {
    getExperienceReviews,
    createExperienceReview,
} from "../services/experienceReviewServices";

import {
    createExperienceBooking,
} from "../services/experienceBookingServices";

import {
    createExperiencePaymentOrder,
    verifyExperiencePayment,
} from "../services/experiencePaymentServices";


const loadRazorpay = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");

        script.src = "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);

        document.body.appendChild(script);
    });
};

function ViewExperience() {
    const navigate = useNavigate();
    const { experienceId } = useParams();
    const { user } = useAuth();

    const [experience, setExperience] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);

    const [reviewError, setReviewError] = useState("");
    const [reviewMessage, setReviewMessage] = useState("");

    const [ratings, setRatings] = useState(0);
    const [reviewComment, setReviewComment] = useState("");

    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const [participants, setParticipants] = useState(1);
    const [slot, setSlot] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [bookingMessage, setBookingMessage] = useState("");

    const [selectedImage, setSelectedImage] = useState(0);
    const [showAllPhotos, setShowAllPhotos] = useState(false);

    const [copied, setCopied] = useState(false);

    const images = Array.isArray(experience?.images)
        ? experience.images.filter(Boolean)
        : [];

    const location = experience?.location || {};

    const fullLocation = [
        location.address,
        location.city,
        location.state,
        location.country,
    ]
        .filter(Boolean)
        .join(", ");

const hostId =
    experience?.host?._id?.toString() ||
    experience?.host?.id?.toString() ||
    experience?.host?.toString();

const currentUserId = user?._id?.toString() || user?.id?.toString();

const isOwner = Boolean(
    currentUserId &&
    hostId &&
    currentUserId === hostId
);

    const fetchReviews = async (id) => {
        try {
            setReviewsLoading(true);
            setReviewError("");

            const { data } = await getExperienceReviews(id);

            setReviews(
                Array.isArray(data.allReviews)
                    ? data.allReviews
                    : []
            );

        } catch (error) {
            console.error(
                "Error fetching reviews:",
                error.response?.data || error.message
            );

            setReviews([]);

            setReviewError(
                error.response?.data?.message ||
                "Unable to load reviews."
            );

        } finally {
            setReviewsLoading(false);
        }
    };


    const handleCreateReview = async (e) => {
        e.preventDefault();

        setReviewError("");
        setReviewMessage("");

        if (!user) {
            setReviewError("Please login before writing a review.");
            return;
        }

        const rating = Number(ratings);

        if (
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {
            setReviewError("Please select a rating between 1 and 5.");
            return;
        }

        if (!reviewComment.trim()) {
            setReviewError("Please write a comment.");
            return;
        }

        try {
            setReviewSubmitting(true);

            await createExperienceReview(experienceId, {
                ratings: rating,
                comment: reviewComment.trim(),
            });

            setReviewMessage("Review submitted successfully!");

            setRatings(0);
            setReviewComment("");

            await fetchReviews(experienceId);

            await fetchExperience(experienceId, false);

        } catch (error) {
            console.error(
                "Create review error:",
                error.response?.data || error.message
            );

            setReviewError(
                error.response?.data?.message ||
                "Failed to submit review. Please try again."
            );

        } finally {
            setReviewSubmitting(false);
        }
    };


    const handleExperienceBooking = async () => {
        setBookingError("");
        setBookingMessage("");

        try {
            if (!user) {
                setBookingError("Please login before booking.");
                return;
            }

            if (!slot) {
                setBookingError("Please select a date and time slot.");
                return;
            }

            if (!Number.isInteger(Number(participants)) || Number(participants) < 1) {
                setBookingError("Please select at least one participant.");
                return;
            }

            const selectedSlot = experience.schedule.find(
                (item) => item._id === slot
            );

            if (!selectedSlot) {
                setBookingError("Selected schedule slot is not available.");
                return;
            }

            if (selectedSlot.spotsLeft < Number(participants)) {
                setBookingError(
                    `Only ${selectedSlot.spotsLeft} spots are available.`
                );
                return;
            }

            setBookingLoading(true);

            const bookingResponse = await createExperienceBooking({
                experienceId: experienceId,
                slotId: slot,
                participants: Number(participants),
            });

            const bookingId = bookingResponse.data.booking._id;

            const orderResponse = await createExperiencePaymentOrder(bookingId);

            const {
                orderId,
                amount,
                currency,
                key,
            } = orderResponse.data;

            const isLoaded = await loadRazorpay();

            if (!isLoaded) {
                setBookingError("Unable to load payment gateway.");
                return;
            }

            const options = {
                key,
                amount,
                currency,
                name: "Stayora",
                description: `Booking for ${experience.title}`,
                order_id: orderId,

                handler: async function (paymentResponse) {
                    try {
                        const verificationResponse = await verifyExperiencePayment({
                            bookingId,
                            razorpay_order_id: paymentResponse.razorpay_order_id,
                            razorpay_payment_id: paymentResponse.razorpay_payment_id,
                            razorpay_signature: paymentResponse.razorpay_signature,
                        });

                        setBookingMessage(
                            "Payment successful! Your experience is confirmed."
                        );

                        await fetchExperience(experienceId, false);

                        setSlot("");
                        setParticipants(1);

                    } catch (error) {
                        console.error(
                            "Experience payment verification error:",
                            error.response?.data || error.message
                        );

                        setBookingError(
                            error.response?.data?.message ||
                            "Payment received, but verification failed. Please contact support."
                        );
                    }
                },

                prefill: {
                    name: user.username || "",
                    email: user.email || "",
                },

                theme: {
                    color: "#222222",
                },

                modal: {
                    ondismiss: function () {
                        setBookingError(
                            "Payment was not completed. Your booking is still pending."
                        );
                    },
                },
            };

            const paymentObject = new window.Razorpay(options);

            paymentObject.on("payment.failed", function (response) {
                setBookingError(
                    response.error?.description || "Payment failed. Please try again."
                );
            });

            paymentObject.open();

        } catch (error) {
            console.error(
                "Experience booking error:",
                error.response?.data || error.message
            );

            setBookingError(
                error.response?.data?.message ||
                "Unable to create experience booking. Please try again."
            );

        } finally {
            setBookingLoading(false);
        }
    };


    const fetchExperience = async (id, showLoader = true) => {
        try {
            if (showLoader) {
                setLoading(true);
            }

            setError("");

            const data = await getExperience(id);

            setExperience(data.experience);

        } catch (error) {
            console.error(
                "Fetch experience error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "We couldn't load this experience. Please try again."
            );

        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    };


    useEffect(() => {
        if (!experienceId) {
            setError("Experience id is missing");
            setLoading(false);
            setReviewsLoading(false);
            return;
        }

        fetchExperience(experienceId);
        fetchReviews(experienceId);

    }, [experienceId]);


    useEffect(() => {
        if (!showAllPhotos) return;

        const count = images.length;

        const onKey = (e) => {
            if (e.key === "Escape") {
                setShowAllPhotos(false);
            }

            if (e.key === "ArrowRight") {
                setSelectedImage((p) =>
                    Math.min(p + 1, count - 1)
                );
            }

            if (e.key === "ArrowLeft") {
                setSelectedImage((p) =>
                    Math.max(p - 1, 0)
                );
            }
        };

        document.body.style.overflow = "hidden";

        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
        };

    }, [showAllPhotos, images.length]);


    const handleShare = async () => {
        const url = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: experience?.title,
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
                console.error("Error sharing experience", error);
            }
        }
    };


    if (loading) {
        return (
            <div className="experience-status">
                <div className="d-flex justify-content-center align-items-center">
                    <div
                        className="spinner-border text-secondary"
                        role="status"
                    >
                        <span className="visually-hidden">
                            Loading...
                        </span>
                    </div>

                    <p>Loading this experience...</p>
                </div>
            </div>
        );
    }


    if (error || !experience) {
        return (
            <div className="experience-status">
                <div>
                    <p>
                        {error || "This experience may have been removed."}
                    </p>

                    <Link
                        to="/experiences"
                        className="experience-primary-button"
                    >
                        Back to experiences
                    </Link>
                </div>
            </div>
        );
    }


    const isUpcoming = (item) => {
        const slotDate = new Date(item.date);
        if (isNaN(slotDate)) return false;

        const match = /^(\d{1,2}):(\d{2})$/.exec(item.startTime || "");

        if (match) {
            slotDate.setHours(Number(match[1]), Number(match[2]), 0, 0);
        } else {
            slotDate.setHours(23, 59, 59, 999);
        }

        return slotDate >= new Date();
    };

    const upcomingSchedule = (experience.schedule || [])
        .filter(isUpcoming)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const firstSchedule = upcomingSchedule[0];


    return (
        <div className="experience-page">
            <main className="experience-container">


                <div className="experience-top-bar">

                    <Link
                        to="/experiences"
                        className="experience-back-link"
                    >
                        ← Back to experiences
                    </Link>


<div className="experience-share-box">

    <button
        type="button"
        onClick={handleShare}
        className="experience-share-button"
    >
        ↗ {copied ? "Copied" : "Share"}
    </button>

    {isOwner && (
        <button
            type="button"
            className="share-btn"
            onClick={() => navigate(`/experiences/${experience._id}/edit`)}
        >
            Edit Experience
        </button>
    )}

</div>

                </div>

                <section className="experience-heading">
                    <div>

                        <h1 className="experience-title">
                            {experience?.title}
                        </h1>

                        <div className="experience-meta">

                            {Number(experience?.avgRating) > 0 && (
                                <>
                                    <span>
                                        {Number(experience.avgRating).toFixed(1)}
                                    </span>

                                    {Number(experience?.reviewCount) > 0 && (
                                        <span>·</span>
                                    )}
                                </>
                            )}

                            {Number(experience?.reviewCount) > 0 && (
                                <>
                                    <span>
                                        {experience.reviewCount}{" "}
                                        {Number(experience.reviewCount) > 1
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
                    <section className="experience-gallery">

                        <div className="experience-gallery-main">
                            <button
                                type="button"
                                onClick={() => setShowAllPhotos(true)}
                            >
                                <img
                                    src={images[selectedImage] || images[0]}
                                    alt={experience.title}
                                />

                                {images.length > 1 && (
                                    <span className="experience-photo-count">
                                        Show all {images.length} photos
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="experience-gallery-thumbnails">

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
                                        alt={`${experience.title} ${index + 2}`}
                                    />
                                </button>
                            ))}

                            {images.length > 1 && (
                                <button
                                    type="button"
                                    className="experience-gallery-see-all"
                                    onClick={() => {
                                        setShowAllPhotos(true);
                                        setSelectedImage(0);
                                    }}
                                >
                                    View all photos
                                </button>
                            )}

                        </div>
                    </section>

                ) : (
                    <div className="experience-no-image">
                        No image available
                    </div>
                )}

                {showAllPhotos && images.length > 0 && (
                    <div
                        className="experience-photo-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="All photos"
                    >

                        <div className="experience-photo-modal-header">

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


                        <div className="experience-photo-modal-body">

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedImage((p) =>
                                        Math.max(p - 1, 0)
                                    )
                                }
                                disabled={selectedImage === 0}
                                aria-label="Previous photo"
                            >
                                ‹
                            </button>


                            <img
                                src={images[selectedImage] || images[0]}
                                alt={`${experience.title} ${selectedImage + 1}`}
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

                <div className="experience-content-grid">

                    <div className="experience-main-column">

                        <section className="experience-section">

                            <div className="experience-schedule-heading">
                                <div>

                                    <h2>
                                        {experience.category} in{" "}
                                        {location.city || "this location"}
                                    </h2>

                                    {firstSchedule ? (
                                        <p>
                                            {firstSchedule.spotsLeft}{" "}
                                            {firstSchedule.spotsLeft === 1
                                                ? "spot"
                                                : "spots"}{" "}
                                            left out of{" "}
                                            {firstSchedule.totalSpots}{" "}
                                            in first slot
                                            {" · "}
                                            {firstSchedule.durationMinutes} mins
                                        </p>
                                    ) : (
                                        <p>
                                            Schedule information is not available.
                                        </p>
                                    )}

                                </div>
                            </div>

                        </section>

                        <section className="experience-section">

                            <h2>About this experience</h2>

                            <p className="experience-description">
                                {experience.description}
                            </p>

                        </section>

                        <section className="experience-section">

                            <h2>Category</h2>

                            <p className="experience-description">
                                {experience.category}
                            </p>

                        </section>

                        <section className="experience-section">

                            <h2>Where you will be</h2>

                            <div className="experience-location-box d-flex">

                                <div className="experience-location-icon d-flex justify-content-center align-items-center">
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

                        <section className="experience-section experience-reviews-section">

                            <div className="experience-reviews-heading">

                                <h2>
                                    {Number(experience.avgRating) > 0
                                        ? `★ ${Number(experience.avgRating).toFixed(1)}`
                                        : "Reviews"}

                                    {Number(experience.reviewCount) > 0 && (
                                        <>
                                            {" · "}
                                            {experience.reviewCount}{" "}
                                            {Number(experience.reviewCount) === 1
                                                ? "review"
                                                : "reviews"}
                                        </>
                                    )}
                                </h2>

                            </div>

                            {reviewsLoading ? (

                                <div className="experience-reviews-loading">
                                    <div
                                        className="spinner-border text-secondary"
                                        role="status"
                                    >
                                        <span className="visually-hidden">
                                            Loading reviews...
                                        </span>
                                    </div>

                                    <p>Loading reviews...</p>
                                </div>

                            ) : reviews.length === 0 ? (

                                <div className="experience-no-reviews">
                                    <h3>No reviews yet</h3>
                                    <p>Be the first one to review</p>
                                </div>

                            ) : (

                                <div className="experience-review-grid">

                                    {reviews.map((review) => {

                                        const isOwner =
                                            Boolean(currentUserId) &&
                                            String(review.guest?._id) ===
                                            String(currentUserId);

                                        return (
                                            <article
                                                key={review._id}
                                                className="experience-review-card"
                                            >

                                                <div className="experience-review-user">

                                                    <div className="experience-review-avatar">
                                                        {(review.guest?.username || "G")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="experience-review-user-info">

                                                        <h3>
                                                            {review.guest?.username || "Guest"}

                                                            {isOwner && " (You)"}
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

                                                <div className="experience-review-ratings">
                                                    <span>
                                                        {"★".repeat(
                                                            Math.max(
                                                                0,
                                                                Math.min(
                                                                    5,
                                                                    Number(review.ratings) || 0
                                                                )
                                                            )
                                                        )}
                                                        {"☆".repeat(
                                                            5 -
                                                            Math.max(
                                                                0,
                                                                Math.min(
                                                                    5,
                                                                    Number(review.ratings) || 0
                                                                )
                                                            )
                                                        )}
                                                    </span>
                                                </div>

                                                <p className="experience-review-comment">
                                                    {review.comment}
                                                </p>

                                            </article>
                                        );
                                    })}

                                </div>
                            )}

                            {reviewError && (
                                <p className="experience-form-error">
                                    {reviewError}
                                </p>
                            )}

                        </section>

                        <section className="experience-create-review">

                            <h2>Write a review</h2>

                            <form onSubmit={handleCreateReview}>


                                <div className="experience-rating-stars">

                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={
                                                star <= ratings
                                                    ? "experience-rating-star active"
                                                    : "experience-rating-star"
                                            }
                                            onClick={() => {
                                                setRatings(star);
                                                setReviewError("");
                                            }}
                                            aria-label={`Rate ${star} out of 5`}
                                        >
                                            ★
                                        </button>
                                    ))}

                                </div>

                                <label htmlFor="reviewComment">
                                    Your experience
                                </label>

                                <textarea
                                    id="reviewComment"
                                    value={reviewComment}
                                    onChange={(e) =>
                                        setReviewComment(e.target.value)
                                    }
                                    placeholder="Tell others about your experience"
                                    maxLength={2000}
                                    rows={5}
                                    required
                                />

                                {reviewError && (
                                    <p className="experience-form-error">
                                        {reviewError}
                                    </p>
                                )}

                                {reviewMessage && (
                                    <p className="experience-form-success">
                                        {reviewMessage}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={reviewSubmitting}
                                >
                                    {reviewSubmitting
                                        ? "Submitting..."
                                        : "Submit Review"}
                                </button>

                            </form>

                        </section>

                    </div>

                </div>

                <aside>


                    <section className="experience-section experience-booking-card">

                        <h2>Book this experience</h2>

                        <p>
                            Price per person: ₹{experience.pricePerPerson}
                        </p>

                        <div className="experience-booking-field">

                            <label htmlFor="experienceSlot" className="experience-form-label">
                                Select date and time
                            </label>

                            <select
                                id="experienceSlot"
                                className="experience-form-control"
                                value={slot}
                                disabled={upcomingSchedule.length === 0}
                                onChange={(e) => {
                                    setSlot(e.target.value);
                                    setBookingError("");
                                    setBookingMessage("");
                                    setParticipants(1);
                                }}
                            >
                                <option value="">
                                    {upcomingSchedule.length === 0
                                        ? "No upcoming schedules"
                                        : "Choose a schedule"}
                                </option>

                                {upcomingSchedule.map((item) => (
                                    <option
                                        key={item._id}
                                        value={item._id}
                                        disabled={item.spotsLeft < 1}
                                    >
                                        {new Date(item.date).toLocaleDateString("en-IN")}
                                        {" - "}
                                        {item.startTime}
                                        {" - "}
                                        {item.spotsLeft} spots left
                                    </option>
                                ))}

                            </select>

                        </div>


                        {slot && (() => {
                            const selectedSlot = experience.schedule.find(
                                (item) => item._id === slot
                            );

                            if (!selectedSlot) return null;

                            return (
                                <div className="experience-booking-field">

                                    <label
                                        htmlFor="experienceParticipants"
                                        className="experience-form-label"
                                    >
                                        Number of participants
                                    </label>

                                    <input
                                        id="experienceParticipants"
                                        type="number"
                                        className="experience-form-control"
                                        min="1"
                                        max={selectedSlot.spotsLeft}
                                        value={participants}
                                        onChange={(e) => {
                                            setParticipants(Number(e.target.value));
                                            setBookingError("");
                                        }}
                                    />

                                    <small className="experience-muted-text">
                                        {selectedSlot.spotsLeft} spots available
                                    </small>

                                </div>
                            );
                        })()}


                        <div className="experience-booking-total">

                            <h3>
                                Total: ₹
                                {Number(experience.pricePerPerson) * Number(participants || 0)}
                            </h3>

                        </div>


                        {bookingError && (
                            <p className="experience-form-error">
                                {bookingError}
                            </p>
                        )}

                        {bookingMessage && (
                            <p className="experience-form-success">
                                {bookingMessage}
                            </p>
                        )}


                        <button
                            type="button"
                            className="experience-primary-button"
                            onClick={handleExperienceBooking}
                            disabled={bookingLoading || !slot}
                        >
                            {bookingLoading ? "Processing..." : "Book Now"}
                        </button>

                    </section>

                </aside>

            </main>
        </div>
    );
}

export default ViewExperience;
