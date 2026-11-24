const Listing = require("../models/listingModel");
const User = require("../models/userModel");
const cloudinary = require("../config/cloudinary");




const createListing = async (req, res) => {
    try {
        // 1. Check if images were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "At least one image is required",
            });
        }

        // 2. Upload all images to Cloudinary
        const cloudinaryUrls = [];

        for (const file of req.files) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "stayora/listings",
                        resource_type: "image",
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve(result);
                    }
                );

                uploadStream.end(file.buffer);
            });

            cloudinaryUrls.push(result.secure_url);
        }

        // 3. Get normal form fields
        const {
            title,
            description,
            propertyType,
            roomType,
            address,
            city,
            state,
            country,
            latitude,
            longitude,
            pricePerNight,
            maxGuest,
            bedrooms,
            amenities,
            houseRules,
        } = req.body;

        // 4. Create Listing object
        const listing = new Listing({
            host: req.user.id,

            title,
            description,
            propertyType,
            roomType,

            location: {
                address,
                city,
                state,
                country,
                latitude: Number(latitude),
                longitude: Number(longitude),
            },

            images: cloudinaryUrls,

            pricePerNight: Number(pricePerNight),
            maxGuest: Number(maxGuest),
            bedrooms: Number(bedrooms),

            amenities: Array.isArray(amenities)
                ? amenities
                : [amenities].filter(Boolean),

            houseRules: Array.isArray(houseRules)
                ? houseRules
                : [houseRules].filter(Boolean),
        });

        // 5. Save listing to MongoDB
        await listing.save();

        // 6. Automatically make the user a host
        await User.findByIdAndUpdate(req.user.id, {
            $set: { isHost: true },
        });

        // 7. Send response
        return res.status(201).json({
            message: "Listing created successfully",
            listing,
        });

    } catch (error) {
        console.log("Create listing error:", error);

        return res.status(500).json({
            message: "Failed to create listing",
            error: error.message,
        });
    }
};





const allListings = async (req, res) => {
  try {
    const {
      search,
      city,
      minPrice,
      maxPrice,
      maxGuest,
      sort,
      page = 1,
      limit = 30,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },

        {
          description: {
            $regex: search,
            $options: "i",
          },
        },

        {
          "location.city": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "location.state": {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (city) {
      filter["location.city"] = {
        $regex: city,
        $options: "i",
      };
    }

    if (minPrice || maxPrice) {
      filter.pricePerNight = {};

      if (minPrice) {
        filter.pricePerNight.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.pricePerNight.$lte = Number(maxPrice);
      }
    }

    if (maxGuest) {
      filter.maxGuest = {
        $gte: Number(maxGuest),
      };
    }

    let sortOption = {};

    if (sort === "price_asc") {
      sortOption.pricePerNight = 1;
    }

    if (sort === "price_desc") {
      sortOption.pricePerNight = -1;
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip = (pageNumber - 1) * limitNumber;
    const totalListings = await Listing.countDocuments(filter);

    const listings = await Listing.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    return res.status(200).json({
      listings,
      count: listings.length,
      totalListings,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalListings / limitNumber),
    });
  } catch (error) {
    console.log("Search listings error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

const viewListing = async (req, res) => {
  try {
    const { listingId } = req.params;

    const selected = await Listing.findById(listingId).populate(
      "host",
      "username email contactNum",
    );

    if (!selected) {
      return res.status(400).json({
        message: "listing not found",
      });
    }

    return res.status(200).json(selected);
  } catch (error) {
    console.log("View listing error:", error);

    return res.status(500).json({
      message: "error viewing listing",
    });
  }
};


const getPublicIdFromCloudinaryUrl = (imageUrl) => {
    const url = new URL(imageUrl);

    const uploadPath = "/upload/";
    const uploadIndex = url.pathname.indexOf(uploadPath);

    if (uploadIndex === -1) {
        return null;
    }

    let publicId = url.pathname.slice(
        uploadIndex + uploadPath.length
    );

    publicId = publicId.replace(/^v\d+\//, "");

    publicId = publicId.replace(/\.[^/.]+$/, "");

    return publicId;
}; 











const editListing = async (req, res) => {
    const uploadedPublicIds = [];
    let databaseSaved = false;

    try {
        const listing = req.listing;

        // 1. Get existing images the host wants to keep
        let existingImages = req.body.existingImages || [];

        if (!Array.isArray(existingImages)) {
            existingImages = [existingImages];
        }

        // 2. Verify that retained images belong to this listing
        const validImages = existingImages.every((image) =>
            listing.images.includes(image)
        );

        if (!validImages) {
            return res.status(400).json({
                message: "Invalid existing images",
            });
        }

        // 3. Validate image count BEFORE uploading
        const totalImages =
            existingImages.length + (req.files?.length || 0);

        if (totalImages === 0 || totalImages > 10) {
            return res.status(400).json({
                message: "A listing must have between 1 and 10 images",
            });
        }

        // 4. Upload new images to Cloudinary
        const newImageUrls = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader
                        .upload_stream(
                            {
                                folder: "stayora/listings",
                            },
                            (error, result) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }
                            }
                        )
                        .end(file.buffer);
                });

                newImageUrls.push(result.secure_url);
                uploadedPublicIds.push(result.public_id);
            } 
        }

        // 5. Combine retained images and newly uploaded images
        const finalImages = [
            ...existingImages,
            ...newImageUrls,
        ];

        // 6. Find images that the host removed
        const removedImages = listing.images.filter(
            (oldImage) => !finalImages.includes(oldImage) 
        );

        // 7. Get listing fields from request
        const {
            title,
            description,
            propertyType,
            roomType,
            pricePerNight,
            maxGuest,
            bedrooms,
            amenities,
            houseRules,
            address,
            city,
            state,
            country,
            latitude,
            longitude,
        } = req.body;

        // 8. Update basic fields
        if (title !== undefined) listing.title = title;
        if (description !== undefined) listing.description = description;
        if (propertyType !== undefined) listing.propertyType = propertyType;
        if (roomType !== undefined) listing.roomType = roomType;

        if (pricePerNight !== undefined) {
            listing.pricePerNight = Number(pricePerNight);
        }

        if (maxGuest !== undefined) {
            listing.maxGuest = Number(maxGuest);
        }

        if (bedrooms !== undefined) {
            listing.bedrooms = Number(bedrooms);
        }

        // 9. Update location
        if (address !== undefined) listing.location.address = address;
        if (city !== undefined) listing.location.city = city;
        if (state !== undefined) listing.location.state = state;
        if (country !== undefined) listing.location.country = country;

        if (latitude !== undefined) {
            listing.location.latitude = Number(latitude);
        }

        if (longitude !== undefined) {
            listing.location.longitude = Number(longitude);
        }

        // 10. Update arrays
        if (amenities !== undefined) {
            listing.amenities = Array.isArray(amenities)
                ? amenities
                : [amenities];
        }

        if (houseRules !== undefined) {
            listing.houseRules = Array.isArray(houseRules)
                ? houseRules
                : [houseRules];
        }

        // 11. Update images
        listing.images = finalImages;

        // 12. Save listing in MongoDB
        await listing.save();

        databaseSaved = true;

        // 13. Delete removed images from Cloudinary
        for (const imageUrl of removedImages) {
            try {
                const url = new URL(imageUrl);
                const uploadIndex = url.pathname.indexOf("/upload/");

                if (uploadIndex === -1) continue;

                let publicId = url.pathname.slice(
                    uploadIndex + "/upload/".length
                );

                // Remove Cloudinary version
                publicId = publicId.replace(/^v\d+\//, "");

                // Remove file extension
                publicId = publicId.replace(/\.[^/.]+$/, "");

                await cloudinary.uploader.destroy(publicId);

            } catch (cleanupError) {
                console.log(
                    "Old image cleanup failed:",
                    cleanupError
                );
            }
        }

        return res.status(200).json({
            message: "Listing updated successfully",
            listing,
        });

    } catch (error) {
        console.log("Edit listing error:", error);

        // If MongoDB save failed, clean up newly uploaded images
        if (!databaseSaved && uploadedPublicIds.length > 0) {
            await Promise.allSettled(
                uploadedPublicIds.map((publicId) =>
                    cloudinary.uploader.destroy(publicId)
                )
            );
        } 

        return res.status(500).json({
            message: "Something went wrong while updating listing",
        });
    }
};





const deleteListing = async (req, res, next) => {
  try {
    const listing = req.listing;

    await listing.deleteOne();

    return res.status(200).json({
      message: "Listing deleted successfully",
    });
  } catch (error) {
    console.log("Delete listing error:", error);
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({
      host: req.user.id,
    }).sort({ createdAt: -1 });

    if (!listings) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    return res.status(200).json({
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.log("Get my Listing error", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

module.exports = {
  createListing,
  allListings,
  viewListing,
  editListing,
  deleteListing,
  getMyListings,
};
