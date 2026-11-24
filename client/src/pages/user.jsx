
import React, { useEffect, useState } from "react";

import {
    getMyProfile,
    getMyBookings,
    cancelStayBooking,
    cancelExperienceBooking,
} from "../services/userServices";

import "../css/user.css";

function User() {
    const [user, setUser] = useState(null);

    const [stays, setStays] = useState([]);
    const [experiences, setExperiences] = useState([]);

    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(true);

    const [cancellingId, setCancellingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch profile
    const fetchUser = async () => {
        try {
            const data = await getMyProfile();
            setUser(data.user);
        } catch (error) {
            console.error("Profile fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch bookings
    const fetchBookings = async () => {
        try {
            const bookingData = await getMyBookings();

            setStays(bookingData.stays || []);
            setExperiences(bookingData.experiences || []);
        } catch (error) {
            console.error("Bookings fetch error:", error);
            setError("Unable to load your bookings.");
        } finally {
            setBookingLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
        fetchBookings();
    }, []);

    // Format dates
    const formatDate = (date) => {
        if (!date) return "N/A";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Format booking status
    const getStatusClass = (status) => {
        const normalizedStatus = String(status || "").toLowerCase();

        if (normalizedStatus === "confirmed") {
            return "status-confirmed";
        }

        if (normalizedStatus === "cancelled") {
            return "status-cancelled";
        }

        if (normalizedStatus === "completed") {
            return "status-completed";
        }

        if (normalizedStatus === "pending") {
            return "status-pending";
        }

        return "status-default";
    };

    // Format refund status
    const getRefundLabel = (status) => {
        const labels = {
            not_requested: "Not requested",
            processing: "Processing",
            processed: "Refunded",
            failed: "Failed",
        };

        return labels[status] || "Not applicable";
    };

    // Decide whether booking can be cancelled
    const canCancel = (booking, type) => {
        const status = String(booking.status || "").toLowerCase();

        if (status === "cancelled" || status === "completed") {
            return false;
        }

        if (type === "stay") {
            return status === "pending" || status === "confirmed";
        }

        return status === "pending" || status === "confirmed";
    };

    // Refresh booking data after cancellation
    const refreshBookings = async () => {
        const bookingData = await getMyBookings();

        setStays(bookingData.stays || []);
        setExperiences(bookingData.experiences || []);
    };

    // Cancel booking
    const handleCancelBooking = async (booking, type) => {
        const bookingId = booking._id;

        const isPaid =
            String(booking.paymentStatus || "").toLowerCase() === "paid";

        const confirmationMessage = isPaid
            ? "This booking has been paid. A refund will be requested. Do you want to continue?"
            : "Are you sure you want to cancel this booking?";

        const confirmed = window.confirm(confirmationMessage);

        if (!confirmed) return;

        try {
            setCancellingId(bookingId);
            setError("");
            setSuccess("");

            let response;

            if (type === "stay") {
                response = await cancelStayBooking(bookingId);
            } else {
                response = await cancelExperienceBooking(bookingId);
            }

            setSuccess(
                response.message || "Booking cancelled successfully."
            );

            // Fetch updated booking and refund status
            await refreshBookings();

        } catch (error) {
            console.error("Booking cancellation error:", error);

    console.log("Full cancellation error:", error);
    console.log("Backend response:", error.response?.data);
    console.log("HTTP status:", error.response?.status);

            setError(
                error.response?.data?.message ||
                "Unable to cancel booking. Please try again."
            );

            // Refresh in case the server processed the request
            // but the response was interrupted.
            try {
                await refreshBookings();
            } catch (refreshError) {
                console.error("Booking refresh error:", refreshError);
            }

        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="profile-spinner"></div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-error">
                Unable to load your profile. Please log in again.
            </div>
        );
    }

    return (
        <div className="user-dashboard">

            {/* PAGE HEADER */}
            <div className="user-page-header">
                <div>
                    <p className="user-eyebrow">YOUR STAYORA ACCOUNT</p>
                    <h1>My Profile</h1>
                    <p>Manage your details and keep track of your trips.</p>
                </div>
            </div>

            {/* PROFILE CARD */}
            <section className="profile-card">

                <div className="profile-avatar">
                    {user.username?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="profile-information">
                    <h2>{user.username}</h2>
                    <p>{user.email}</p>

                    <div className="profile-contact">
                        <span>Contact</span>
                        <strong>{user.contact || "Not provided"}</strong>
                    </div>
                </div>

            </section>

            {/* FEEDBACK */}
            {success && (
                <div className="booking-alert booking-alert-success">
                    {success}
                </div>
            )}

            {error && (
                <div className="booking-alert booking-alert-error">
                    {error}
                </div>
            )}

            {/* BOOKINGS HEADER */}
            <div className="bookings-heading">
                <div>
                    <p className="user-eyebrow">YOUR RESERVATIONS</p>
                    <h2>My Bookings</h2>
                </div>

                <span className="booking-count">
                    {stays.length + experiences.length} bookings
                </span>
            </div>

            {bookingLoading ? (
                <div className="booking-loading">
                    <div className="profile-spinner"></div>
                    <p>Loading your bookings...</p>
                </div>
            ) : (
                <>
                    {/* ================= STAY BOOKINGS ================= */}

                    <section className="booking-section">

                        <div className="section-heading">
                            <div>
                                <h3>Stay Bookings</h3>
                                <p>Your stays and accommodation reservations</p>
                            </div>

                            <span>{stays.length} stays</span>
                        </div>

                        {stays.length === 0 ? (
                            <div className="empty-bookings">
                                <div className="empty-booking-icon">⌂</div>
                                <h4>No stay bookings yet</h4>
                                <p>
                                    Your next getaway is waiting for you.
                                </p>
                            </div>
                        ) : (
                            <div className="booking-grid">

                                {stays.map((booking) => (
                                    <article
                                        className="stay-booking-card"
                                        key={booking._id}
                                    >

                                        <div className="booking-image-wrapper">
                                            {booking.image ? (
                                                <img
                                                    src={booking.image}
                                                    alt={booking.title || "Stay"}
                                                    className="booking-image"
                                                />
                                            ) : (
                                                <div className="booking-image-placeholder">
                                                    Stayora
                                                </div>
                                            )}

                                            <span className={`booking-status ${getStatusClass(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </div>

                                        <div className="booking-card-content">

                                            <h4>{booking.title || "Your stay"}</h4>

                                            <p className="booking-location">
                                                <span>⌖</span>
                                                {booking.location?.city || "Location unavailable"}
                                            </p>

                                            <div className="booking-details">
                                                <div>
                                                    <span>Check-in</span>
                                                    <strong>
                                                        {formatDate(booking.checkIn)}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Check-out</span>
                                                    <strong>
                                                        {formatDate(booking.checkOut)}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="booking-divider"></div>

                                            <div className="booking-payment-row">
                                                <div>
                                                    <span>Payment</span>
                                                    <strong>
                                                        {booking.paymentStatus || "N/A"}
                                                    </strong>
                                                </div>

                                                <div className="booking-price">
                                                    <span>Total price</span>
                                                    <strong>
                                                        ₹{booking.totalPrice}
                                                    </strong>
                                                </div>
                                            </div>

                                            {booking.refundStatus &&
                                                booking.refundStatus !== "not_requested" && (
                                                    <div className="refund-information">
                                                        <span>Refund status</span>
                                                        <strong>
                                                            {getRefundLabel(booking.refundStatus)}
                                                        </strong>
                                                    </div>
                                                )}

                                            {canCancel(booking, "stay") && (
                                                <button
                                                    className="cancel-booking-button"
                                                    disabled={cancellingId === booking._id}
                                                    onClick={() =>
                                                        handleCancelBooking(booking, "stay")
                                                    }
                                                >
                                                    {cancellingId === booking._id
                                                        ? "Cancelling..."
                                                        : "Cancel booking"}
                                                </button>
                                            )}

                                            {String(booking.status).toLowerCase() === "cancelled" && (
                                                <div className="cancelled-message">
                                                    This booking has been cancelled.
                                                </div>
                                            )}

                                        </div>
                                    </article>
                                ))}

                            </div>
                        )}

                    </section>

                    {/* ================= EXPERIENCE BOOKINGS ================= */}

                    <section className="booking-section experience-section">

                        <div className="section-heading">
                            <div>
                                <h3>Experience Bookings</h3>
                                <p>Activities, adventures and experiences you've booked</p>
                            </div>

                            <span>{experiences.length} experiences</span>
                        </div>

                        {experiences.length === 0 ? (
                            <div className="empty-bookings">
                                <div className="empty-booking-icon">✧</div>
                                <h4>No experiences booked yet</h4>
                                <p>
                                    Discover something memorable with Stayora.
                                </p>
                            </div>
                        ) : (
                            <div className="booking-grid">

                                {experiences.map((booking) => (
                                    <article
                                        className="stay-booking-card"
                                        key={booking._id}
                                    >

                                        <div className="booking-image-wrapper">
                                            {booking.image ? (
                                                <img
                                                    src={booking.image}
                                                    alt={booking.title || "Experience"}
                                                    className="booking-image"
                                                />
                                            ) : (
                                                <div className="booking-image-placeholder">
                                                    Experience
                                                </div>
                                            )}

                                            <span className={`booking-status ${getStatusClass(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </div>

                                        <div className="booking-card-content">

                                            <h4>{booking.title || "Your experience"}</h4>

                                            <p className="booking-location">
                                                <span>⌖</span>
                                                {booking.location?.city || "Location unavailable"}
                                            </p>

                                            <div className="booking-details">
                                                <div>
                                                    <span>Experience date</span>
                                                    <strong>
                                                        {formatDate(booking.slot?.date)}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Start time</span>
                                                    <strong>
                                                        {booking.slot?.startTime || "N/A"}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="experience-participants">
                                                <span>Participants</span>
                                                <strong>{booking.participants}</strong>
                                            </div>

                                            <div className="booking-divider"></div>

                                            <div className="booking-payment-row">
                                                <div>
                                                    <span>Payment</span>
                                                    <strong>
                                                        {booking.paymentStatus || "N/A"}
                                                    </strong>
                                                </div>

                                                <div className="booking-price">
                                                    <span>Total price</span>
                                                    <strong>
                                                        ₹{booking.totalPrice}
                                                    </strong>
                                                </div>
                                            </div>

                                            {booking.refundStatus &&
                                                booking.refundStatus !== "not_requested" && (
                                                    <div className="refund-information">
                                                        <span>Refund status</span>
                                                        <strong>
                                                            {getRefundLabel(booking.refundStatus)}
                                                        </strong>
                                                    </div>
                                                )}

                                            {canCancel(booking, "experience") && (
                                                <button
                                                    className="cancel-booking-button"
                                                    disabled={cancellingId === booking._id}
                                                    onClick={() =>
                                                        handleCancelBooking(booking, "experience")
                                                    }
                                                >
                                                    {cancellingId === booking._id
                                                        ? "Cancelling..."
                                                        : "Cancel booking"}
                                                </button>
                                            )}

                                            {String(booking.status).toLowerCase() === "cancelled" && (
                                                <div className="cancelled-message">
                                                    This booking has been cancelled.
                                                </div>
                                            )}

                                        </div>
                                    </article>
                                ))}

                            </div>
                        )}

                    </section>
                </>
            )}

        </div>
    );
}

export default User;


























// import React from 'react'
// import { useState, useEffect } from 'react';
// import { getMyProfile, getMyBookings } from '../services/userServices';

// function User() {

//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [experiences, setExperiences] = useState([]);
//     const [stays, setStays] = useState([]);
//     const [bookingLoading, setBookingLoading] = useState(true);

//    useEffect(() => {

//     const fetchUser = async () => {
//         try {
//             const data = await getMyProfile();
//             setUser(data.user);
//         }
//         catch (error) {
//             console.log("Profile fetch error:", error);
//         }
//         finally {
//             setLoading(false);
//         }
//     };

//     const fetchBookings = async () => {
//         try {
//             const bookingData = await getMyBookings();

//             setStays(bookingData.stays);
//             setExperiences(bookingData.experiences);
//         }
//         catch (error) {
//             console.log("Bookings fetch error:", error);
//         }
//         finally {
//             setBookingLoading(false);
//         }
//     };

//     fetchUser();
//     fetchBookings();

// }, []);

//     if (loading) {
//         return <h3>Loading profile...</h3>;
//     }

//     if (!user) {
//         return <h3>Unable to load profile.</h3>;
//     }

//     return (
// <div>



//         <div className="container mt-5">

//             <h2>My Profile</h2>

//             <div className="card p-4 mt-3">

//                 <h4>{user.username}</h4>

//                 <p>Email: {user.email}</p>

//                 <p>Contact: {user.contact || "Not provided"}</p>

//             </div>

//         </div>


//  <div className="container mt-5">

//             <h2>My Bookings</h2>

//             {/* Stay Bookings */}
//             <h4 className="mt-4">Stay Bookings</h4>

//             {stays.length === 0 ? (
//                 <p>You have no stay bookings.</p>
//             ) : (

//                 stays.map((booking) => (

//                     <div className="card p-3 mb-3" key={booking._id}>

//                         <h5>{booking.title}</h5>

//                         {booking.image && (
//                             <img
//                                 src={booking.image}
//                                 alt={booking.title}
//                                 style={{
//                                     width: "150px",
//                                     height: "100px",
//                                     objectFit: "cover"
//                                 }}
//                             />
//                         )}

//                         <p>Location: {booking.location?.city || "N/A"}</p>

//                         <p>Check-in: {booking.checkIn}</p>

//                         <p>Check-out: {booking.checkOut}</p>

//                         <p>Total Price: ₹{booking.totalPrice}</p>

//                         <p>Status: {booking.status}</p>

//                     </div>

//                 ))

//             )}

//             {/* Experience Bookings */}
//             <h4 className="mt-5">Experience Bookings</h4>

//             {experiences.length === 0 ? (
//                 <p>You have no experience bookings.</p>
//             ) : (

//                 experiences.map((booking) => (

//                     <div className="card p-3 mb-3" key={booking._id}>

//                         <h5>{booking.title}</h5>

//                         {booking.image && (
//                             <img
//                                 src={booking.image}
//                                 alt={booking.title}
//                                 style={{
//                                     width: "150px",
//                                     height: "100px",
//                                     objectFit: "cover"
//                                 }}
//                             />
//                         )}

//                         <p>Location: {booking.location?.city || "N/A"}</p>

//                         <p>Participants: {booking.participants}</p>

//                         <p>Total Price: ₹{booking.totalPrice}</p>

//                         <p>Status: {booking.status}</p>

//                         {booking.slot && (
//                             <>
//                                 <p>Date: {booking.slot.date}</p>
//                                 <p>Time: {booking.slot.startTime}</p>
//                             </>
//                         )}

//                     </div>

//                 ))

//             )}

//         </div>


// </div>


//     );
// }

// export default User;
