import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/authContext';
import { useState } from 'react';
import { useEffect } from 'react';

import { getListingById, editListing } from '../services/listingServices';

import "../css/createListing.css"

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

function EditListing() {

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

    const { listingId } = useParams();
    const navigate = useNavigate();

    const { user, loading } = useAuth();
   const [ saving , setSaving ] = useState(false);
    const [listingLoading, setListingLoading] = useState(true);
    const [error, setError] = useState("")
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);

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
            longitude: "",
        },
        pricePerNight: "",
        maxGuest: "",
        bedrooms: "",
        amenities: [],
        houseRules: [],

    });

    useEffect(() => {
        if (loading) return;

        if (!user) {
            navigate("/login");
            return;
        }

        const fetchListing = async () => {
            try {
                setListingLoading(true);

                const response = await getListingById(listingId);

                const selected = response.data;

                const hostId = selected.host?._id || selected.host?.id || selected.host;
                const currentUserId = user?.id || user?._id;
                if (String(hostId) !== String(currentUserId)) {
                    navigate(`/listings/${listingId}`);
                    return;
                }

                setForm({
                    title: selected.title || "",
                    description: selected.description || "",
                    propertyType: selected.propertyType || "",
                    roomType: selected.roomType || "",


                    location: {
                        address: selected.location?.address || "",
                        city: selected.location?.city || "",
                        state: selected.location?.state || "",
                        country: selected.location?.country || "",
                        latitude: selected.location?.latitude ?? "",
                        longitude: selected.location?.longitude ?? "",
                    },

                    pricePerNight: selected.pricePerNight ?? "",
                    maxGuest: selected.maxGuest ?? "",
                    bedrooms: selected.bedrooms ?? "",
                    amenities: selected.amenities || [],
                    houseRules: selected.houseRules || [],

                });


                setExistingImages(selected.images || []);

            }
            catch (error) {
                console.error("Error featching images", error);

                setError(
                    error.response?.data?.message || "Unable to load listing"
                );

            }
            finally {
                setListingLoading(false);
            }
        };
        fetchListing();

    }, [listingId, user, loading, navigate]);

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        const totalImages = existingImages.length + newImages.length + selectedFiles.length;

        if (totalImages > 6) {
            alert("You can upload a maximum of 6 images");
            e.target.value = "";
            return;
        }

        setNewImages((prevImages) => [
            ...prevImages,
            ...selectedFiles
        ]);
        e.target.value = "";

    };

    const removeExistingImage = (indexToRemove) => {
        setExistingImages((prevImages) =>
            prevImages.filter(
                (_, index) => index !== indexToRemove
            )
        );
    };

    const removeNewImage = (indexToRemove) => {
        setNewImages((prevImages) =>
            prevImages.filter((_, index) => index !== indexToRemove)
        );
    };


    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };


    const handleLocationChange = (e) => {
        const { name, value } = e.target;

        setForm((prevForm) => ({
            ...prevForm,
            location: {
                ...prevForm.location,
                [name]: value,
            },
        }));
    };


    const selectType = (type) => {
        setForm((prevForm) => ({
            ...prevForm,
            propertyType: type,
        }));
    };


    const selectRoomType = (type) => {
        setForm((prevForm) => ({
            ...prevForm,
            roomType: type,
        }));
    };

    const handleAmenityChange = (amenity) => {
        setForm((prevForm) => {
            const alreadySelected = prevForm.amenities.includes(amenity);

            return {
                ...prevForm,
                amenities: alreadySelected ?
                    prevForm.amenities.filter((item) => item !== amenity) :
                    [...prevForm.amenities, amenity]
            }

        })
    }


    const handleHouseRuleChange = (rule) => {
        setForm((prevForm) => {
            const alreadySelected = prevForm.houseRules.includes(rule);

            return {
                ...prevForm,
                houseRules: alreadySelected ?
                    prevForm.houseRules.filter((item) => item !== rule)
                    : [...prevForm.houseRules, rule]
            };
        });
    };

    const handleSubmit = async (e) =>{
        e.preventDefault();

if(existingImages.length + newImages.length === 0){
    alert("Please keep or upload at least on image");
    return;
}

try{
    setSaving(true);

    const formData = new FormData;
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("propertyType", form.propertyType);
    formData.append("roomType" , form.roomType);
    formData.append("address" , form.location.address);
    formData.append("city", form.location.city);
    formData.append("state", form.location.state);
    formData.append("country", form.location.country);
    formData.append("latitude", form.location.latitude);
    formData.append("longitude", form.location.longitude);
    formData.append("pricePerNight", form.pricePerNight);
formData.append("maxGuest", form.maxGuest);
formData.append("bedrooms", form.bedrooms);

    form.amenities.forEach((amenity) => {
        formData.append("amenities", amenity)
    })


    form.houseRules.forEach((rule)=> {
        formData.append("houseRules", rule) 
    });

   existingImages.forEach((image) => {
    formData.append("existingImages", image);
});

    newImages.forEach((image) => {
        formData.append("images", image);
    });

    await editListing(listingId, formData);

 alert("Listing updated successfully!");
   navigate(`/listings/${listingId}`);
}
catch(error){
  console.error("Error updating listing:", error);

        alert(
            error.response?.data?.message ||
            "Unable to update listing"
        );
}
finally{
    setSaving(false)
}


    }

    return (
        <div className='container'>
            <div className='row d-flex justify-content-center'>
                <div className='col-6'>
                    <div>
                        <h1 className='mt-5 fw-bold'>Edit your listing</h1>
                        <div className='head'>Start making changes</div>
                    </div>

                    <div>
                        <h4 className='mt-5 fw-medium'>Name and describe your place</h4>
                        <div className='head'>Short titles work best. </div>
                    </div>

                    <div className='mt-5'>
                        <div className='label mb-1'>Enter title</div>


                        <input
                            className='form-control inp'
                            type="text"
                            id="title"
                            name='title'
                            value={form.title}
                            onChange={handleChange}

                        />

                    </div>

                    <div className='mt-5'>
                        <div className='label mb-1'>
                            Describe your home.
                        </div>

                        <textarea
                            className='form-control inp'
                            value={form.description}

                            onChange={handleChange}
                            name="description"
                            id="description" />
                    </div>


                    <hr className='mt-5' />

                    <div>
                        <h4 className='mt-5 fw-medium'>Which of these describes your place?</h4>
                        <div className='head mb-1'>Select property type</div>

                        <div className='options'>
                            {propertyTypes.map((item) => (
                                <button
                                    key={item}
                                    value={form.propertyType}
                                    type='button'
                                    className={form.propertyType === item ? "type-btn active" : "type-btn"}
                                    onClick={() => selectType(item)}
                                >   <span className="icon">{typeIcons[item]}</span>
                                    {item}</button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className='mt-5 fw-medium'>What will guests have access to</h4>
                        <div className='head mb-1'>Select room type</div>

                        <div className='options-2'>
                            {roomTypes.map((itemm) => (
                                <button
                                type='button'
                                    key={itemm}
                                    value={form.roomType}
                                    className={form.roomType === itemm ? "type-btn active" : "type-btn"}
                                    onClick={() => selectRoomType(itemm)}
                                > {itemm}</button>
                            ))}
                        </div>

                    </div>

                    <hr className='mt-5' />


                    <div>
                        <h4 className='mt-5 fw-medium'>Where's your place located?</h4>
                        <div className='head mb-1'> Guests only see the exact address after they book.</div>


                        <div className='row mt-1 g-3'>
                            <div className='col-12'>
                                <input
                                    type="text"
                                    name='address'
                                    className='form-control form-control-lg inp inpu'
                                    value={form.location.address}
                                    onChange={handleLocationChange}
                                    placeholder='Address'
                                />
                            </div>

                            <div className='col-6'>
                                <input type="text"
                                    name='city'
                                    className='form-control form-control-lg inp inpu'
                                    onChange={handleLocationChange}
                                    value={form.location.city}
                                    placeholder='City'
                                />
                            </div>


                            <div className='col-6'>
                                <input type="text"
                                    name='state'
                                    className='form-control form-control-lg inp inpu'
                                    onChange={handleLocationChange}
                                    value={form.location.state}
                                    placeholder='State'
                                />
                            </div>


                            <div className='col-12'>
                                <input
                                    className='form-control form-control-lg inp inpu'
                                    type="text"
                                    name="country"
                                    value={form.location.country}
                                    onChange={handleLocationChange}
                                    placeholder='Country'
                                />

                            </div>

                            <div className='col-6'>
                                <input
                                    className='form-control form-control-lg inp inpu'
                                    type="number"
                                    name='latitude'
                                    value={form.location.latitude}
                                    placeholder='Latitude'
                                    onChange={handleLocationChange}
                                />
                            </div>

                            <div className='col-6'>
                                <input
                                    className='form-control form-control-lg inp inpu'
                                    type="number"
                                    name='longitude'
                                    value={form.location.longitude}
                                    placeholder='Longitude'
                                    onChange={handleLocationChange}
                                />
                            </div>

                        </div>
                    </div>


                    <hr className='mt-5' />


                    <div>
                        <h4 className='mt-5 fw-medium'>Add photos of your stay</h4>
                        <div className='head mb-3'>The first photo is your cover photo</div>


                        <label htmlFor="images" className='img-box'>
                            <MdAddPhotoAlternate className='img-icon' />
                            <strong>Upload photos</strong>
                            <span className='head'>Choose one or more images</span>
                            <span className='imh-btn'>Upload from device</span>
                        </label>

                        <input
                            type="file"
                            id='images'
                            accept='image/*'
                            multiple
                            hidden
                            onChange={handleImageChange}
                        />


                        <div className='image-preview-container'>
                            {existingImages.map((image, index) => (
                                <div key={`existing-${index}`} className='image-preview'>
                                    <img src={image} alt={`Existing image${index + 1}`} />
                                    {index === 0 && (
                                        <span className='cover-badge'>Cover photo</span>
                                    )}
                                    <button
                                        type='button'
                                        className='remove-btn'
                                        onClick={() => removeExistingImage(index)}
                                    > ×</button>


                                </div>
                            ))}

                            {newImages.map((image, index) => (
                                <div key={`new-${index}`} className='image-preview'>
                                    <img src={URL.createObjectURL(image)} alt={`new image ${index + 1}`} />
                                    {existingImages.length === 0 && index === 0 && (
                                        <span className='cover-badge'>Cover photo</span>
                                    )}

                                    <button
                                        type='button'
                                        className='remove-btn'
                                        onClick={() => removeNewImage(index)}
                                    >×</button>

                                </div>
                            ))}
                        </div>
                    </div>

                    <hr className='mt-5' />


                    <div className='mt-5'>
                        <h4 className='fw-medium'>Set your price </h4>
                        <div className='head mb-3'>You can change it any time.</div>

                        <label htmlFor="pricePerNight" className='label mb-1'>Price per night</label>

                        <div className='price'>
                            <span>₹</span>
                            <input
                                type="number"
                                id='pricePerNight'
                                name='pricePerNight'
                                value={form.pricePerNight}
                                onChange={handleChange}
                            />
                            <em>/night</em>
                        </div>

                        <div className='mb-container mt-2'>
                            <div>
                                <div className='label mt-2'>
                                    <label htmlFor="maxGuest">Mximum guests</label>
                                </div>

                                <input
                                    type="number"
                                    className='form-control form-control-lg mt-2 mr-1 inp mb-input'
                                    id='maxGuest'
                                    name='maxGuest'
                                    value={form.maxGuest}
                                    onChange={handleChange}
                                    min={1}
                                    max={10}
                                />
                            </div>

                            <div>
                                <div className='label mt-2'>
                                    <label htmlFor="bedrooms">Total bedrooms</label>
                                </div>

                                <input
                                    type="number"
                                    className='form-control form-control-lg mt-2 gap-2 ml-1 inp mb-input'
                                    id='bedrooms'
                                    name='bedrooms'
                                    value={form.bedrooms}
                                    onChange={handleChange}
                                    min={1}
                                    max={20}
                                />

                            </div>


                        </div>

                    </div>

                    <hr className='mt-5' />


                    <div className='mt-5'>
                        <h4 className='fw-medium'>What does your place offer?</h4>
                        <div className="head mb-3">Amenities</div>

                        <div className='amenities-container'>
                            {amenityOptions.map((amenity) => (
                                <div key={amenity} className='amenity-box'>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={form.amenities.includes(amenity)}
                                            onChange={() => handleAmenityChange(amenity)}
                                        />

                                        <div>{amenity}</div>
                                    </label>
                                </div>
                            ))}
                        </div>


                    </div>

                    <hr className="mt-5" />


                    <div className='mt-5'>
                        <h4 className="fw-medium">Set your house rules</h4>
                        <div className="head mb-3">Guests must agree to these before booking.</div>

                        <div className='rules-container'>
                            {houseRuleOptions.map((rule) => (
                                <div key={rule} className='rule-box'>
                                    <label className='rule-lbl'>
                                        {rule}
                                        <input
                                            type="checkbox"
                                            checked={form.houseRules.includes(rule)}
                                            onChange={() => handleHouseRuleChange(rule)}
                                        />
                                    </label>
                                </div>
                            ))}
                        </div>


                    </div>

                </div>
            </div>

<div className='footer-container'>
    <div className='footer-inner'>
        <small className='head'>Your listing gets updated once you submit. </small>

<button
type='button'
className='submit-btn'
onClick={handleSubmit}
  disabled={saving}
> {saving ? "Updating..." : "Submit"}</button>

    </div>
</div>


        </div>

    );
}

export default EditListing;
