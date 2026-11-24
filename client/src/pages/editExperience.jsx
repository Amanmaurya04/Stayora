
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/authContext";

import {
    getExperienceById,
    editExperience
} from "../services/experienceServices";

import "../css/createExperience.css";

import {
    FaUtensils,
    FaMountain,
    FaSpa,
    FaMap,
    FaPalette,
    FaTrophy,
    FaMartiniGlass,
    FaShapes
} from "react-icons/fa6";

import { MdAddPhotoAlternate } from "react-icons/md";

const categoryIcons = {
    food: <FaUtensils />,
    adventure: <FaMountain />,
    wellness: <FaSpa />,
    tour: <FaMap />,
    art: <FaPalette />,
    sports: <FaTrophy />,
    nightlife: <FaMartiniGlass />,
    other: <FaShapes />
};

function EditExperience() {

    const categoryTypes = [
        "food",
        "adventure",
        "wellness",
        "tour",
        "art",
        "sports",
        "nightlife",
        "other"
    ];

    const { experienceId } = useParams();
    const navigate = useNavigate();

    const { user, loading } = useAuth();

    // Loading states
    const [saving, setSaving] = useState(false);
    const [experienceLoading, setExperienceLoading] = useState(true);

    // Error message
    const [error, setError] = useState("");

    // Image states
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);

    // Schedule editing state
    const [editingSlotId, setEditingSlotId] = useState(null);

    // Main experience form
    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
        pricePerPerson: "",
        location: {
            address: "",
            city: "",
            state: "",
            country: "",
            latitude: "",
            longitude: ""
        },
        schedules: []
    });

    // Individual schedule input state
    const [slot, setSlot] = useState({
        date: "",
        startTime: "",
        durationMinutes: "",
        totalSpots: ""
    });


    // =====================================
    // 1. HANDLE NORMAL INPUT CHANGES
    // =====================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };


    // =====================================
    // 2. HANDLE LOCATION INPUT CHANGES
    // =====================================

    const handleLocationChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            location: {
                ...prev.location,
                [name]: value
            }
        }));
    };


    // =====================================
    // 3. SELECT CATEGORY
    // =====================================

    const selectCategory = (category) => {
        setForm((prev) => ({
            ...prev,
            category
        }));
    };


    // =====================================
    // 4. FETCH EXPERIENCE DETAILS
    // =====================================

    useEffect(() => {

        if (loading) return;

        if (!user) {
            navigate("/login");
            return;
        }

        let cancelled = false;

        const fetchExperience = async () => {

            try {
                setExperienceLoading(true);
                setError("");

                const response = await getExperienceById(experienceId);

                const selected = response.data.experience;

                // Get host ID
                const hostId =
                    selected.host?._id ||
                    selected.host?.id ||
                    selected.host;

                // Get logged-in user ID
                const currentUserId = user?._id || user?.id;

                // Check whether logged-in user owns this experience
                if (String(hostId) !== String(currentUserId)) {

                    navigate(`/experiences/${experienceId}`);
                    return;
                }

                if (cancelled) return;

                // Fill the form with existing experience details
                setForm({
                    title: selected.title || "",
                    description: selected.description || "",
                    category: selected.category || "",
                    pricePerPerson: selected.pricePerPerson ?? "",

                    location: {
                        address: selected.location?.address || "",
                        city: selected.location?.city || "",
                        state: selected.location?.state || "",
                        country: selected.location?.country || "",
                        latitude: selected.location?.latitude ?? "",
                        longitude: selected.location?.longitude ?? ""
                    },

                    // Backend uses schedule (singular)
                    // Frontend uses schedules (plural)
                    schedules: (selected.schedule || []).map((s) => ({
                        ...s
                    }))
                });

                // Store existing image URLs
                setExistingImages(selected.images || []);

            } catch (err) {

                console.error("Error fetching experience:", err);

                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load experience"
                    );
                }

            } finally {

                if (!cancelled) {
                    setExperienceLoading(false);
                }
            }
        };

        fetchExperience();

        return () => {
            cancelled = true;
        };

    }, [experienceId, loading, user, navigate]);


    // =====================================
    // 5. HANDLE SCHEDULE INPUT CHANGES
    // =====================================

    const handleSlot = (e) => {

        const { name, value } = e.target;

        setSlot((prev) => ({
            ...prev,
            [name]: value
        }));
    };


    // =====================================
    // 6. ADD OR UPDATE SCHEDULE SLOT
    // =====================================

    const addSlot = () => {

        // Check empty fields
        if (
            !slot.date ||
            !slot.startTime ||
            !slot.durationMinutes ||
            !slot.totalSpots
        ) {
            alert("Please fill all schedule fields");
            return;
        }

        // Convert values into numbers
        const duration = Number(slot.durationMinutes);
        const totalSpots = Number(slot.totalSpots);

        // Validate numbers
        if (
            !Number.isInteger(duration) ||
            !Number.isInteger(totalSpots) ||
            duration <= 0 ||
            totalSpots <= 0
        ) {
            alert("Duration and total spots must be positive integers");
            return;
        }

        // Create updated slot object
        const updatedSlot = {
            date: slot.date,
            startTime: slot.startTime,
            durationMinutes: duration,
            totalSpots
        };


        // CASE 1: EDITING AN EXISTING OR NEW SLOT

        if (editingSlotId !== null) {

            setForm((prev) => ({
                ...prev,

                schedules: prev.schedules.map((s) => {

                    const currentId = s._id || s.tempId;

                    if (currentId === editingSlotId) {

                        return {
                            ...s,
                            ...updatedSlot
                        };
                    }

                    return s;
                })
            }));

        }


        // CASE 2: ADDING A NEW SLOT

        else {

            setForm((prev) => ({
                ...prev,

                schedules: [
                    ...prev.schedules,

                    {
                        ...updatedSlot,

                        // Temporary frontend ID
                        tempId: crypto.randomUUID()
                    }
                ]
            }));

        }


        // Reset editing mode
        setEditingSlotId(null);

        // Clear inputs
        setSlot({
            date: "",
            startTime: "",
            durationMinutes: "",
            totalSpots: ""
        });

    };


    // =====================================
    // 7. EDIT SCHEDULE SLOT
    // =====================================

    const editSlot = (s) => {

        // Existing slot has _id
        // New slot has tempId
        setEditingSlotId(s._id || s.tempId);

        // Put selected slot details into inputs
        setSlot({
            date: s.date?.split("T")[0] || "",
            startTime: s.startTime || "",
            durationMinutes: s.durationMinutes ?? "",
            totalSpots: s.totalSpots ?? ""
        });

    };


    // =====================================
    // 8. REMOVE SCHEDULE SLOT
    // =====================================

    const removeSlot = (index) => {

        const slotToRemove = form.schedules[index];

        setForm((prev) => ({
            ...prev,

            schedules: prev.schedules.filter(
                (_, i) => i !== index
            )
        }));

        // If the removed slot was being edited,
        // clear the editing state
        if (
            (slotToRemove._id || slotToRemove.tempId) === editingSlotId
        ) {

            setEditingSlotId(null);

            setSlot({
                date: "",
                startTime: "",
                durationMinutes: "",
                totalSpots: ""
            });
        }

    };


    // =====================================
    // 9. HANDLE IMAGE UPLOAD
    // =====================================

    const handleImageChange = (e) => {

        const selectedFiles = Array.from(e.target.files);

        const totalImages =
            existingImages.length +
            newImages.length +
            selectedFiles.length;

        // Backend allows maximum 10 images
        if (totalImages > 10) {

            alert("You can upload a maximum of 10 images");

            e.target.value = "";
            return;
        }

        setNewImages((prev) => [
            ...prev,
            ...selectedFiles
        ]);

        // Reset input so the same file can be selected again
        e.target.value = "";

    };


    // =====================================
    // 10. REMOVE EXISTING IMAGE
    // =====================================

    const removeExistingImages = (indexToRemove) => {

        setExistingImages((prev) =>
            prev.filter((_, index) => index !== indexToRemove)
        );

    };


    // =====================================
    // 11. REMOVE NEW IMAGE
    // =====================================

    const removeNewImage = (indexToRemove) => {

        setNewImages((prev) =>
            prev.filter((_, index) => index !== indexToRemove)
        );

    };


    // =====================================
    // 12. SUBMIT UPDATED EXPERIENCE
    // =====================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            setSaving(true);
            setError("");

            // Basic validation
            if (!form.title.trim()) {
                alert("Please enter experience title");
                return;
            }

            if (!form.description.trim()) {
                alert("Please enter experience description");
                return;
            }

            if (!form.category) {
                alert("Please select a category");
                return;
            }

            if (Number(form.pricePerPerson) <= 0) {
                alert("Please enter a valid price");
                return;
            }

            if (existingImages.length + newImages.length === 0) {
                alert("At least one image is required");
                return;
            }

            if (form.schedules.length === 0) {
                alert("Please add at least one schedule slot");
                return;
            }


            // Create FormData
            const formData = new FormData();


            // Append normal experience fields
            formData.append("title", form.title);
            formData.append("description", form.description);
            formData.append("category", form.category);
            formData.append(
                "pricePerPerson",
                Number(form.pricePerPerson)
            );


            // Append location as JSON
            formData.append(
                "location",
                JSON.stringify(form.location)
            );


            // Remove temporary IDs before sending to backend
            const scheduleToSubmit = form.schedules.map(
                ({ tempId, ...schedule }) => schedule
            );


            // Backend expects schedule (singular)
            formData.append(
                "schedule",
                JSON.stringify(scheduleToSubmit)
            );


            // Send remaining existing image URLs
            formData.append(
                "existingImages",
                JSON.stringify(existingImages)
            );


            // Append newly selected images
            newImages.forEach((image) => {
                formData.append("images", image);
            });


            // Call backend service
            const response = await editExperience(
                experienceId,
                formData
            );

            console.log("Experience updated:", response.data);

            alert("Experience updated successfully!");

            // Navigate to updated experience
            navigate(`/experiences/${experienceId}`);

        } catch (err) {

            console.error("Error updating experience:", err);

            const message =
                err.response?.data?.message ||
                "Unable to update experience";

            setError(message);

        } finally {

            setSaving(false);
        }

    };


    // =====================================
    // 13. LOADING SCREEN
    // =====================================

    if (loading || experienceLoading) {

        return (
            <div className="container mt-5 text-center">
                <h4>Loading experience...</h4>
            </div>
        );
    }


    // =====================================
    // 14. MAIN UI
    // =====================================

    return (

        <div className="container">

            <form onSubmit={handleSubmit}>

                <div className="row d-flex justify-content-center">

                    <div className="col-6">

                        {/* TITLE */}

                        <div>
                            <h1 className="mt-5 fw-bold">
                                Edit your experience
                            </h1>

                            <div className="head">
                                Tell guests about your Experience.
                                You can edit everything later.
                            </div>
                        </div>


                        {/* EXPERIENCE DETAILS */}

                        <div>
                            <h4 className="mt-5 fw-medium">
                                Name and describe your experience
                            </h4>

                            <div className="head">
                                Short titles work best.
                                Say what makes it special.
                            </div>
                        </div>


                        {/* TITLE INPUT */}

                        <div className="mt-5">
                            <div className="label mb-1">
                                Enter title
                            </div>
                        </div>

                        <input
                            type="text"
                            className="form-control inp"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Photography session in the Himalayas"
                        />


                        {/* DESCRIPTION */}

                        <div className="mt-5">

                            <div className="label mb-1">
                                Enter Description
                            </div>

                            <textarea
                                name="description"
                                className="form-control inp"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Describe your experience"
                            />

                        </div>


                        <hr className="mt-5" />


                        {/* CATEGORY */}

                        <div>

                            <h4 className="mt-5 fw-medium">
                                Which of these best describes your Experience?
                            </h4>

                            <div className="head mb-1">
                                Select category type
                            </div>

                            <div className="category-options mt-2">

                                {categoryTypes.map((item) => (

                                    <button
                                        key={item}
                                        type="button"
                                        className={`d-flex align-items-center ${
                                            form.category === item
                                                ? "type-btn active"
                                                : "type-btn"
                                        }`}
                                        onClick={() => selectCategory(item)}
                                    >

                                        <span className="icon">
                                            {categoryIcons[item]}
                                        </span>

                                        {item}

                                    </button>

                                ))}

                            </div>

                        </div>


                        <hr className="mt-5" />


                        {/* IMAGES */}

                        <div>

                            <h4 className="mt-5 fw-medium">
                                Edit photos of your experience
                            </h4>

                            <div className="head mb-3">
                                The first photo is your cover photo.
                            </div>

                            <label
                                htmlFor="images"
                                className="img-box"
                            >
                                <MdAddPhotoAlternate className="img-icon" />

                                <strong>Upload photos</strong>

                                <span className="head">
                                    Choose one or more images
                                </span>

                                <span className="imh-btn">
                                    Upload from device
                                </span>

                            </label>

                            <input
                                type="file"
                                id="images"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={handleImageChange}
                            />


                            {/* IMAGE PREVIEWS */}

                            <div className="image-preview-container">

                                {existingImages.map((image, index) => (

                                    <div
                                        key={`existing-${index}`}
                                        className="image-preview"
                                    >

                                        <img
                                            src={image}
                                            alt={`Existing image ${index + 1}`}
                                        />

                                        {index === 0 && (
                                            <span className="cover-badge">
                                                Cover photo
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={() =>
                                                removeExistingImages(index)
                                            }
                                        >
                                            ×
                                        </button>

                                    </div>

                                ))}


                                {newImages.map((image, index) => (

                                    <div
                                        key={`new-${index}`}
                                        className="image-preview"
                                    >

                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt={`New image ${index + 1}`}
                                        />

                                        {existingImages.length === 0 &&
                                            index === 0 && (
                                                <span className="cover-badge">
                                                    Cover photo
                                                </span>
                                            )}

                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={() =>
                                                removeNewImage(index)
                                            }
                                        >
                                            ×
                                        </button>

                                    </div>

                                ))}

                            </div>

                            <div className="head mt-2">
                                {existingImages.length + newImages.length}/10 images selected
                            </div>

                        </div>


                        <hr className="mt-5" />


                        {/* PRICE */}

                        <div className="mt-5">

                            <h4 className="fw-medium">
                                Set your price
                            </h4>

                            <div className="head mb-3">
                                You can change it any time.
                            </div>

                            <label
                                htmlFor="pricePerPerson"
                                className="label mb-1"
                            >
                                Price per person
                            </label>

                            <div className="price">

                                <span>₹</span>

                                <input
                                    type="number"
                                    id="pricePerPerson"
                                    name="pricePerPerson"
                                    min="1"
                                    value={form.pricePerPerson}
                                    onChange={handleChange}
                                    placeholder="0"
                                />

                                <em>/ person</em>

                            </div>

                        </div>


                        <hr className="mt-5" />


                        {/* LOCATION */}

                        <h4 className="fw-medium">
                            Where's your Event?
                        </h4>

                        <div className="head mb-3">
                            Guests only see the exact address after they book.
                        </div>


                        <div className="row mt-1 g-3">

                            <div className="col-12">

                                <input
                                    className="form-control form-control-lg inp inpu"
                                    name="address"
                                    value={form.location.address}
                                    placeholder="Address"
                                    type="text"
                                    onChange={handleLocationChange}
                                />

                            </div>


                            <div className="col-6">

                                <input
                                    className="form-control form-control-lg inp inpu"
                                    type="text"
                                    name="city"
                                    value={form.location.city}
                                    onChange={handleLocationChange}
                                    placeholder="City"
                                />

                            </div>


                            <div className="col-6">

                                <input
                                    className="form-control form-control-lg inp inpu"
                                    type="text"
                                    name="state"
                                    value={form.location.state}
                                    onChange={handleLocationChange}
                                    placeholder="State"
                                />

                            </div>


                            <div className="col-12">

                                <input
                                    className="form-control form-control-lg inp inpu"
                                    type="text"
                                    name="country"
                                    value={form.location.country}
                                    onChange={handleLocationChange}
                                    placeholder="Country"
                                />

                            </div>


                            <div className="col-6">

                                <input
                                    className="form-control form-control-lg inp inpu"
                                    type="number"
                                    name="latitude"
                                    value={form.location.latitude}
                                    onChange={handleLocationChange}
                                    placeholder="Latitude"
                                />

                            </div>


                            <div className="col-6">

                                <input
                                    className="form-control form-control-lg inp inpu"
                                    type="number"
                                    name="longitude"
                                    value={form.location.longitude}
                                    onChange={handleLocationChange}
                                    placeholder="Longitude"
                                />

                            </div>

                        </div>

                    </div>


                    {/* =====================================
                        SCHEDULE SECTION
                    ===================================== */}

                    <div className="mt-5">

                        <h4 className="fw-medium">
                            {editingSlotId !== null
                                ? "Edit schedule slot"
                                : "Add new slot"}
                        </h4>

                        <div className="head mb-3">
                            Add one or more dates and times.
                        </div>


                        {/* DATE */}

                        <div className="row g-3">

                            <div className="col-6">

                                <input
                                    type="date"
                                    name="date"
                                    className="form-control inp inpu"
                                    value={slot.date}
                                    onChange={handleSlot}
                                />

                            </div>


                            {/* START TIME */}

                            <div className="col-6">

                                <input
                                    type="time"
                                    name="startTime"
                                    value={slot.startTime}
                                    className="form-control inp inpu"
                                    onChange={handleSlot}
                                />

                            </div>


                            {/* DURATION */}

                            <div className="col-6">

                                <input
                                    type="number"
                                    name="durationMinutes"
                                    min="1"
                                    step="1"
                                    placeholder="Duration (minutes)"
                                    value={slot.durationMinutes}
                                    onChange={handleSlot}
                                    className="form-control inp inpu"
                                />

                            </div>


                            {/* TOTAL SPOTS */}

                            <div className="col-6">

                                <input
                                    type="number"
                                    name="totalSpots"
                                    min="1"
                                    step="1"
                                    placeholder="Total spots"
                                    value={slot.totalSpots}
                                    onChange={handleSlot}
                                    className="form-control inp inpu"
                                />

                            </div>


                            {/* ADD / UPDATE BUTTON */}

                            <div className="col-12">

                                <button
                                    type="button"
                                    className="btn  add-slot-btn"
                                    onClick={addSlot}
                                >

                                    {editingSlotId !== null
                                        ? "Update slot"
                                        : "+ Add slot"}

                                </button>


                                {/* CANCEL EDITING */}

                                {editingSlotId !== null && (

                                    <button
                                        type="button"
                                        className="btn add-slot-btn  ms-2"
                                        onClick={() => {

                                            setEditingSlotId(null);

                                            setSlot({
                                                date: "",
                                                startTime: "",
                                                durationMinutes: "",
                                                totalSpots: ""
                                            });

                                        }}
                                    >
                                        Cancel
                                    </button>

                                )}

                            </div>

                        </div>


                        {/* =====================================
                            DISPLAY ALL SCHEDULE SLOTS
                        ===================================== */}

                        <div className="mt-3 end-button">

                            {form.schedules.map((s, i) => (

                                <div
                                    key={s._id || s.tempId}
                                    className="d-flex justify-content-between align-items-center border rounded p-2 mb-2"
                                >

                                    <span>
                                        {s.date?.split("T")[0]} at {s.startTime} ·{" "}
                                        {s.durationMinutes} min ·{" "}
                                        {s.totalSpots}{" "}
                                        {s.totalSpots > 1 ? "spots" : "spot"}
                                    </span>


                                    <div className="d-flex gap-2">

                                        <button
                                            type="button"
                                            className="btn btn edit-slot"
                                            onClick={() => editSlot(s)}
                                        >
                                            Edit
                                        </button>


                                        <button
                                            type="button"
                                            className="btn remove-slot"
                                            onClick={() => removeSlot(i)}
                                        >
                                            Remove
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>


                </div>


                {/* ERROR MESSAGE */}

                {error && (
                    <div className="alert alert-danger mt-4">
                        {error}
                    </div>
                )}


                {/* SAVE BUTTON */}

                {/* <div className="d-flex justify-content-center mt-5 mb-5">

                    <button
                        type="submit"
                        className="btn btn-dark btn-lg"
                        disabled={saving}
                    >

                        {saving
                            ? "Saving changes..."
                            : "Save changes"}

                    </button>

                </div> */}

                 <div className="footer-container">
                    <div className="footer-inner">

                        <small className="head">
                            Your Experience goes live once you create it.
                        </small>

                        <button
                            type="submit"
                            className="submit-btn"
                        >
                            Create Experience
                        </button>

                    </div>
                </div>

            </form>

        </div>

    );

}

export default EditExperience;
