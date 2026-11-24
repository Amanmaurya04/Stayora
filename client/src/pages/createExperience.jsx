import React from 'react';
import "../css/createExperience.css";
import { createExperience } from "../services/experienceServices";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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

function CreateExperience() {
    const navigate = useNavigate();

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

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
        images: [],
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

    const [slot, setSlot] = useState({
        date: "",
        startTime: "",
        durationMinutes: "",
        totalSpots: ""
    });

    const [error, setErrors] = useState({});


    const handleSlotChange = (e) => {
        const { name, value } = e.target;

        setSlot((prev) => ({
            ...prev,
            [name]: value
        }));
    };


    const addSlot = () => {
        if (
            !slot.date ||
            !slot.startTime ||
            !slot.durationMinutes ||
            !slot.totalSpots
        ) {
            alert("Fill all the spots");
            return;
        }

        if (
            Number(slot.durationMinutes) <= 0 ||
            Number(slot.totalSpots) <= 0
        ) {
            alert("Duration and total spots must be greater than zero");
            return;
        }

        setForm((prev) => ({
            ...prev,
            schedules: [
                ...prev.schedules,
                {
                    date: slot.date,
                    startTime: slot.startTime,
                    durationMinutes: Number(slot.durationMinutes),
                    totalSpots: Number(slot.totalSpots)
                }
            ]
        }));

        setSlot({
            date: "",
            startTime: "",
            durationMinutes: "",
            totalSpots: ""
        });
    };


    const removeSlot = (index) => {
        setForm((prev) => ({
            ...prev,
            schedules: prev.schedules.filter(
                (_, i) => i !== index
            )
        }));
    };


    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };


    const selectCategory = (selectedCategory) => {
        setForm((prev) => ({
            ...prev,
            category: selectedCategory
        }));
    };


    const handleLocation = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            location: {
                ...prev.location,
                [name]: value
            }
        }));
    };


    const handleImage = (e) => {
        const selectedFiles = Array.from(e.target.files);

        if (form.images.length + selectedFiles.length > 6) {
            alert("You can upload a maximum of 6 images");
            e.target.value = "";
            return;
        }

        setForm((prev) => ({
            ...prev,
            images: [
                ...prev.images,
                ...selectedFiles
            ]
        }));


        e.target.value = "";
    };


    const validate = () => {
        const e = {};
        const loc = form.location


        if (!form.title.trim()) { e.title = "Title is required"; }
        if (!form.description.trim()) { e.description = "Description is required"; }
        if (!form.category.trim()) { e.category = "Category is reequired"; }
        if (form.images.length === 0) { e.images = "Add at least 1 photo"; }
        if (form.images.length > 6) { e.images = "Maximum 6 photos"; }

        if (form.pricePerPerson === "" ||
            !Number.isFinite(Number(form.pricePerPerson)) ||
            Number(form.pricePerPerson) <= 0
        ) {
            e.pricePerPerson = "Enter a valid price"
        }


        if (!loc.address.trim()) { e.address = "Address is required" }
        if (!loc.city.trim()) { e.city = "City is required"; }
        if (!loc.state.trim()) { e.state = "State is required"; }
        if (!loc.country.trim()) { e.country = "Country is required"; }
        if (loc.latitude === "" ||
            !Number.isFinite(Number(loc.latitude)) ||
            Number(loc.latitude) < -90 ||
            Number(loc.latitude) > 90
        ) { e.latitude = "Enter a valid latitude (-90 to 90)"; }

        if (
            loc.longitude === "" ||
            !Number.isFinite(Number(loc.longitude)) ||
            Number(loc.longitude) < -180 ||
            Number(loc.longitude) > 180
        ) {
            e.longitude = "Enter a valid longitude (-180 to 180)";
        }

        if (form.schedules.length === 0) {
            e.schedules = "Add at least one available slot";
        }

        setErrors(e);
        return Object.keys(e).length === 0

    }


const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
        return;
    }

    try {
        const formData = new FormData();

        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("category", form.category);

        form.images.forEach((image) => {
            formData.append("images", image);
        });

        formData.append("pricePerPerson", form.pricePerPerson);

        formData.append(
            "location",
            JSON.stringify(form.location)
        );

        formData.append(
            "schedule",
            JSON.stringify(form.schedules)
        );

        const response = await createExperience(formData);

        console.log("Server response:", response);

        navigate("/experiences");
    } catch (error) {
        console.error("Failed to create experience:", error);

        alert(
            error.response?.data?.message ||
            "Failed to create experience. Please try again."
        );
    }
};

    return (
        <div className="container">

            <form onSubmit={handleSubmit}>

                <div className="row d-flex justify-content-center">

                    <div className="col-6">

                        <div>
                            <h1 className="mt-5 fw-bold">
                                Get Started
                            </h1>

                            <div className="head">
                                Tell guests about your Experience.
                               You can edit later.
                            </div>
                        </div>

                        <div>
                            <h4 className="mt-5 fw-medium">
                                Name and describe your place
                            </h4>

                            <div className="head">
                                Short titles work best. Say what makes it special.
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="label mb-1">
                                Enter title
                            </div>

                            <input
                                type="text"
                                className="form-control inp"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="Photography session in the Himalayas"
                            />
                            {error.title && (
                                <p className="error-text">{error.title}</p>
                            )}
                        </div>

                        <div className="mt-5">
                            <div className="label mb-1">
                                Enter Description
                            </div>

                            <textarea
                                name="description"
                                id="description"
                                className="form-control inp"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Professional photography workshop in the beds of Himalayan"
                            />
                            {error.description && (
                                <p className="error-text">{error.description}</p>
                            )}
                        </div>

                        <hr className="mt-5" />

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
                                        className={`d-flex align-items-center ${form.category === item
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
                            {error.category && (
                                <p className="error-text">{error.category}</p>
                            )}
                        </div>

                        <hr className="mt-5" />

                        <div>
                            <h4 className="mt-5 fw-medium">
                                Add photos of your experience
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

                                <span className="img-btn">
                                    Upload from device
                                </span>
                            </label>

                            <input
                                type="file"
                                id="images"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={handleImage}
                            />
                            {error.images && (
                                <p className="error-text">{error.images}</p>
                            )}

                            <div className="image-preview-container">

                                {form.images.map((image, index) => (
                                    <div
                                        key={index}
                                        className="image-preview"
                                    >
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt={`preview ${index + 1}`}
                                        />

                                        {index === 0 && (
                                            <span className="cover-badge">
                                                Cover photo
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            className="remove-btn"
                                            aria-label="Remove photo"
                                            onClick={() => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    images: prev.images.filter(
                                                        (_, indexImage) =>
                                                            indexImage !== index
                                                    )
                                                }));
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}

                            </div>
                        </div>

                        <hr className="mt-5" />

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
                             {error.pricePerPerson && (
                                    <p className="error-text">{error.pricePerPerson}</p>
                                )}

                        </div>

                        <hr className="mt-5" />

                        <div className='mt-5'>

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
                                        type="text" 
                                        name="address"
                                        value={form.location.address}
                                        onChange={handleLocation}
                                        placeholder="Address"
                                    />
                                     {error.address && (
                                <p className="error-text">{error.address}</p>
                            )}
                                </div>

                                <div className="col-6">
                                    <input
                                        className="form-control form-control-lg inp inpu"
                                        type="text"
                                        name="city"
                                        value={form.location.city}
                                        onChange={handleLocation}
                                        placeholder="City"
                                    />
                                     {error.city && (
                                <p className="error-text">{error.city}</p>
                            )}
                                </div>

                                <div className="col-6">
                                    <input
                                        className="form-control form-control-lg inp inpu"
                                        type="text"
                                        name="state"
                                        value={form.location.state}
                                        onChange={handleLocation}
                                        placeholder="State"
                                    />
                                     {error.state && (
                                <p className="error-text">{error.state}</p>
                            )}
                                </div>

                                <div className="col-12">
                                    <input
                                        className="form-control form-control-lg inp inpu"
                                        type="text"
                                        name="country"
                                        value={form.location.country}
                                        onChange={handleLocation}
                                        placeholder="Country"
                                    />
                                     {error.country && (
                                <p className="error-text">{error.country}</p>
                            )}
                                </div>

                                <div className="col-6">
                                    <input
                                        className="form-control form-control-lg inp inpu"
                                        type="number"
                                        name="latitude"
                                        value={form.location.latitude}
                                        onChange={handleLocation}
                                        placeholder="Latitude"
                                    />
                                     {error.latitude && (
                                <p className="error-text">{error.latitude}</p>
                            )}
                                </div>

                                <div className="col-6">
                                    <input
                                        className="form-control form-control-lg inp inpu"
                                        type="number"
                                        name="longitude"
                                        value={form.location.longitude}
                                        onChange={handleLocation}
                                        placeholder="Longitude"
                                    />
                                     {error.longitude && (
                                <p className="error-text">{error.longitude}</p>
                            )}
                                </div>

                            </div>

                        </div>

                        <hr className="mt-5" />

                        <div className="mt-5">

                            <h4 className="fw-medium">
                                When is your experience available?
                            </h4>

                            <div className="head mb-3">
                                Add one or more dates and times.
                            </div>

                            <div className="row g-3">

                                <div className="col-6">
                                    <input
                                        type="date"
                                        name="date"
                                        className="form-control inp inpu"
                                        value={slot.date}
                                        onChange={handleSlotChange}
                                        min={new Date().toISOString().split("T")[0]}
                                    />
                                </div>

                                <div className="col-6">
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={slot.startTime}
                                        className="form-control inp inpu"
                                        onChange={handleSlotChange}
                                    />
                                </div>

                                <div className="col-6">
                                    <input
                                        type="number"
                                        name="durationMinutes"
                                        min="1"
                                        step="1"
                                        placeholder="Duration (minutes)"
                                        value={slot.durationMinutes}
                                        onChange={handleSlotChange}
                                        className="form-control inp inpu"
                                    />
                                </div>

                                <div className="col-6">
                                    <input
                                        type="number"
                                        name="totalSpots"
                                        min="1"
                                        step="1"
                                        placeholder="Total spots"
                                        className="form-control inp inpu"
                                        value={slot.totalSpots}
                                        onChange={handleSlotChange}
                                    />
                                </div>

                                <div className="col-12">
                                    <button
                                        type="button"
                                        className="btn btn-outline-dark add-slot-btn"
                                        onClick={addSlot}
                                    >
                                        + Add slot
                                    </button>
                                </div>

                            </div>

                             {error.schedules && (
                                <p className="error-text">{error.schedules}</p>
                            )}

                            <div className="mt-3 end-button">

                                {form.schedules.map((s, i) => (
                                    <div
                                        key={i}
                                        className="d-flex justify-content-between align-items-center border rounded p-2 mb-2"
                                    >
                                        <span>
                                            {s.date} at {s.startTime} ·{" "}
                                            {s.durationMinutes} min ·{" "}
                                            {s.totalSpots} {s.totalSpots > 1 ? "spots" : "spot"}
                                        </span>

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => removeSlot(i)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}

                            </div>

                        </div>

                        <hr className="mt-5" />

                    </div>

                </div>

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

export default CreateExperience;
