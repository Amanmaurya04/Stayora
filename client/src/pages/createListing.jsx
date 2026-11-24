import React, { useState } from "react";
import "../css/createListing.css";
import { createListing } from "../services/listingServices";
import { useNavigate } from "react-router-dom";

import {
    MdHome,
    MdApartment,
    MdVilla,
    MdHotel,
    MdOtherHouses,
    MdBed,
    MdCabin,
    MdCottage,
    MdAddPhotoAlternate
} from "react-icons/md";

const typeIcons = {
    House: <MdHome />,
    Apartment: <MdApartment />,
    Villa: <MdVilla />,
    Hotel: <MdHotel />,
    Guesthouse: <MdOtherHouses />,
    Hostel: <MdBed />,
    Cabin: <MdCabin />,
    Cottage: <MdCottage />
};

function CreateListing() {
    const navigate = useNavigate();

    const propertyTypes = [
        "House",
        "Apartment",
        "Villa",
        "Hotel",
        "Guesthouse",
        "Hostel",
        "Cabin",
        "Cottage"
    ];

    const roomTypes = [
        "Entire place",
        "Private room",
        "Shared room"
    ];

    const amenityOptions = [
        "WiFi",
        "Kitchen",
        "Parking",
        "Air conditioning",
        "TV",
        "Washing machine",
        "Pool",
        "Heating"
    ];

    const houseRuleOptions = [
        "No smoking",
        "No parties",
        "Pets allowed",
        "No loud music",
        "No additional guests"
    ];

    const [form, setForm] = useState({
        title: "",
        description: "",
        propertyType: "",
        roomType: "",

        location: {
            address: "",
            city: "",
            state: "",
            country: "",
            latitude: "",
            longitude: ""
        },

        pricePerNight: "",
        maxGuest: "",
        bedrooms: "",

        amenities: [],
        houseRules: [],
        images: []
    });


    const [errors, setErrors] = useState({});



    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value
        });
    };



    const selectType = (selectedType) => {
        setForm({
            ...form,
            propertyType: selectedType
        });
    };



    const selectRoomType = (selectedRoomType) => {
        setForm({
            ...form,
            roomType: selectedRoomType
        });
    };



    const handleLocationChange = (e) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            location: {
                ...form.location,
                [name]: value
            }
        });
    };



    const handleAmenityChange = (e) => {
        const { value, checked } = e.target;

        if (checked) {
            setForm({
                ...form,
                amenities: [
                    ...form.amenities,
                    value
                ]
            });
        } else {
            setForm({
                ...form,
                amenities: form.amenities.filter(
                    (amenity) => amenity !== value
                )
            });
        }
    };



    const handleHouseRuleChange = (e) => {
        const { value, checked } = e.target;

        if (checked) {
            setForm({
                ...form,
                houseRules: [
                    ...form.houseRules,
                    value
                ]
            });
        } else {
            setForm({
                ...form,
                houseRules: form.houseRules.filter(
                    (rule) => rule !== value
                )
            });
        }
    };



    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        if (form.images.length + selectedFiles.length > 6) {
            alert("You can upload a maximum of 6 images");
            e.target.value = "";
            return;
        }

        setForm({
            ...form,
            images: [
                ...form.images,
                ...selectedFiles
            ]
        });

        e.target.value = "";
    };



    const validate = () => {
        const e = {};
        const loc = form.location;

        if (!form.title.trim()) e.title = "Title is required";
        if (!form.description.trim()) e.description = "Description is required";
        if (!form.propertyType) e.propertyType = "Select a property type";
        if (!form.roomType) e.roomType = "Select a room type";

        if (!loc.address.trim()) e.address = "Address is required";
        if (!loc.city.trim()) e.city = "City is required";
        if (!loc.state.trim()) e.state = "State is required";
        if (!loc.country.trim()) e.country = "Country is required";
        if (loc.latitude === "") e.latitude = "Latitude is required";
        if (loc.longitude === "") e.longitude = "Longitude is required";

        if (form.images.length === 0) e.images = "Add at least 1 photo";
        if (form.images.length > 6) e.images = "Maximum 6 photos";

        if (form.pricePerNight === "" || Number(form.pricePerNight) <= 0)
            e.pricePerNight = "Enter a valid price";

        if (form.maxGuest === "" || Number(form.maxGuest) < 1 || Number(form.maxGuest) > 10)
            e.maxGuest = "Guests must be between 1 and 10";

        if (form.bedrooms === "" || Number(form.bedrooms) < 1 || Number(form.bedrooms) > 20)
            e.bedrooms = "Bedrooms must be between 1 and 20";

        setErrors(e);
        return Object.keys(e).length === 0;
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        const formData = new FormData();

        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("propertyType", form.propertyType);
        formData.append("roomType", form.roomType);

        formData.append("address", form.location.address);
        formData.append("city", form.location.city);
        formData.append("state", form.location.state);
        formData.append("country", form.location.country);
        formData.append("latitude", form.location.latitude);
        formData.append("longitude", form.location.longitude);

        formData.append("pricePerNight", form.pricePerNight);
        formData.append("maxGuest", form.maxGuest);
        formData.append("bedrooms", form.bedrooms);

        form.amenities.forEach((amenity) => {
            formData.append("amenities", amenity);
        });

        form.houseRules.forEach((rule) => {
            formData.append("houseRules", rule);
        });

        form.images.forEach((image) => {
            formData.append("images", image);
        });

        try {
            const response = await createListing(formData);
            console.log("SERVER RESPONSE:", response);
            navigate("/listings");
        }
        catch (error) {
            console.log("UPLOAD ERROR:", error);
            alert(error.response?.data?.message || "Something went wrong");
        }
    };


    return (

        <div className="container">

            <div className="row d-flex justify-content-center">
                <div className="col-6">

                    <div>
                        <h1 className="mt-5 fw-bold">Get Started</h1>
                        <div className="head">Tell guests about your place. You can edit everything later.</div>
                    </div>

                    <div>
                        <h4 className="mt-5 fw-medium">Name and describe your place</h4>
                        <div className="head">Short titles work best. Say what makes it special.</div>
                    </div>


                    <div className="mt-5">
                        <div className="label mb-1">
                            Enter title
                        </div>

                        <input
                            className="form-control inp"
                            type="text"
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Beautiful mountain villa"
                        />
                        {errors.title && <p className="error-text">{errors.title}</p>}
                    </div>


                    <div className="mt-5">
                        <div className="label mb-1">
                            Describe your home
                        </div>

                        <textarea
                            className="form-control inp"
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe your property..."
                        />
                        {errors.description && <p className="error-text">{errors.description}</p>}
                    </div>

                    <hr className="mt-5" />


                    <div>
                        <h4 className="mt-5 fw-medium">
                            Which of these best describes your place?
                        </h4>
                        <div className="head  mb-1">Select property type</div>

                        <div className="options">
                            {propertyTypes.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    className={
                                        form.propertyType === item
                                            ? "type-btn active"
                                            : "type-btn"
                                    }
                                    onClick={() => selectType(item)}
                                >
                                    <span className="icon">{typeIcons[item]}</span>
                                    {item}
                                </button>
                            ))}
                        </div>
                        {errors.propertyType && <p className="error-text">{errors.propertyType}</p>}
                    </div>

                    <hr className="mt-5" />


                    <div>
                        <h4 className="mt-5 fw-medium">
                            What will guests have access to?
                        </h4>
                        <div className="head mb-1">Select room type</div>

                        <div className="options-2">
                            {roomTypes.map((itemm) => (
                                <button
                                    key={itemm}
                                    type="button"
                                    className={
                                        form.roomType === itemm ?
                                            "type-btn active" : "type-btn"
                                    }
                                    onClick={() => selectRoomType(itemm)}
                                >
                                    {itemm}
                                </button>
                            ))}
                        </div>
                        {errors.roomType && <p className="error-text">{errors.roomType}</p>}
                    </div>

                    <hr className="mt-5" />


                    <div>
                        <h4 className="mt-5 fw-medium">
                            Where's your place located?
                        </h4>
                        <div className="head mb-1">Guests only see the exact address after they book.</div>

                        <div className="row mt-1 g-3">

                            <div className="col-12">
                                <input
                                    className="form-control form-control-lg inp inpu"
                                    type="text"
                                    name="address"
                                    value={form.location.address}
                                    onChange={handleLocationChange}
                                    placeholder="Address"
                                />
                                {errors.address && <p className="error-text">{errors.address}</p>}
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
                                {errors.city && <p className="error-text">{errors.city}</p>}
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
                                {errors.state && <p className="error-text">{errors.state}</p>}
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
                                {errors.latitude && <p className="error-text">{errors.latitude}</p>}
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
                                {errors.longitude && <p className="error-text">{errors.longitude}</p>}
                            </div>

                        </div>
                    </div>

                    <hr className="mt-5" />





                    <div>
                        <h4 className="mt-5 fw-medium">Add photos of your stay</h4>
                        <div className="head mb-3">
                            The first photo is your cover photo.
                        </div>

                        <label htmlFor="images" className="img-box">
                            <MdAddPhotoAlternate className="img-icon" />
                            <strong>Upload photos</strong>
                            <span className="head">Choose one or more images</span>
                            <span className="img-btn">Upload from device</span>
                        </label>

                        <input
                            type="file"
                            id="images"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={handleImageChange}
                        />
                        {errors.images && <p className="error-text">{errors.images}</p>}

                        <div className="image-preview-container">
                            {form.images.map((image, index) => (
                                <div key={index} className="image-preview">
                                    <img
                                        src={URL.createObjectURL(image)}
                                        alt={`preview ${index + 1}`}
                                    />

                                    {index === 0 && (
                                        <span className="cover-badge">Cover photo</span>
                                    )}

                                    <button
                                        type="button"
                                        className="remove-btn"
                                        aria-label="Remove photo"
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                images: form.images.filter(
                                                    (_, imageIndex) => imageIndex !== index
                                                )
                                            })
                                        }
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <hr className="mt-5" />


                    <div className="mt-5">
                        <h4 className="fw-medium">Set your price</h4>
                        <div className="head mb-3">You can change it any time.</div>

                        <label htmlFor="pricePerNight" className="label mb-1">Price per night</label>
                        <div className="price">
                            <span>₹</span>
                            <input
                                type="number"
                                id="pricePerNight"
                                name="pricePerNight"
                                value={form.pricePerNight}
                                onChange={handleChange}
                                placeholder="0"
                            />
                            <em>/ night</em>
                        </div>
                        {errors.pricePerNight && <p className="error-text">{errors.pricePerNight}</p>}

                        <div className="mb-container mt-2">

                            <div>
                                <div className="label mt-2">
                                    <label htmlFor="maxGuest">
                                        Maximum guests
                                    </label>
                                </div>

                                <input
                                    className="form-control  mt-2 mr-1 inp mb-input"
                                    type="number"
                                    id="maxGuest"
                                    name="maxGuest"
                                    value={form.maxGuest}
                                    onChange={handleChange}
                                    min={1}
                                    max={10}
                                    placeholder="Maximum guests"
                                />
                                {errors.maxGuest && <p className="error-text">{errors.maxGuest}</p>}
                            </div>

                            <div>
                                <div className="label mt-2">
                                    <label htmlFor="bedrooms">
                                        Total Bedrooms
                                    </label>
                                </div>

                                <input
                                    className="form-control  mt-2 gap-2 ml-1 inp mb-input"
                                    type="number"
                                    id="bedrooms"
                                    name="bedrooms"
                                    value={form.bedrooms}
                                    onChange={handleChange}
                                    min={1}
                                    max={20}
                                    placeholder="Bedrooms"
                                />
                                {errors.bedrooms && <p className="error-text">{errors.bedrooms}</p>}
                            </div>

                        </div>
                    </div>

                    <hr className="mt-5" />


                    <div className="mt-5">
                        <h4 className="fw-medium">What does your place offer?</h4>
                        <div className="head mb-3">Amenities</div>

                        <div className="amenity-container">
                            {amenityOptions.map((amenity) => (
                                <div key={amenity} className="amenity-box">
                                    <label>
                                        <input
                                            type="checkbox"
                                            value={amenity}
                                            checked={form.amenities.includes(amenity)}
                                            onChange={handleAmenityChange}
                                        />
                                        <div>
                                            {amenity}
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <hr className="mt-5" />


                    <div className="mt-5">
                        <h4 className="fw-medium">Set your house rules</h4>
                        <div className="head mb-3">Guests must agree to these before booking.</div>

                        <div className="rules-container">
                            {houseRuleOptions.map((rule) => (
                                <div key={rule} className="rule-box ">
                                    <label className="rule-lbl">
                                        {rule}
                                        <input
                                            type="checkbox"
                                            value={rule}
                                            checked={form.houseRules.includes(rule)}
                                            onChange={handleHouseRuleChange}
                                        />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>


            <div className="footer-container ">
                <div className="footer-inner">
                    <small className="head">
                        Your listing goes live once you create it.
                    </small>

                    <button
                        type="button"
                        className="submit-btn"
                        onClick={handleSubmit}
                    >
                        Create listing
                    </button>
                </div>
            </div>

        </div>
    );
}

export default CreateListing;