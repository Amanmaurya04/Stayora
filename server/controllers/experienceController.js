const { json } = require("express");
const cloudinary = require("../config/cloudinary");
const Experience = require("../models/experienceModel");
const ExperienceBooking = require("../models/experienceBookingModel");




const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "stayora/experiences", resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(file.buffer);
  });

const createExperience = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    const { title, description, category, pricePerPerson } = req.body;

    let location, schedule;
    try {
      location = JSON.parse(req.body.location);
      schedule = JSON.parse(req.body.schedule);
    } catch {
      return res
        .status(400)
        .json({ message: "Invalid location or schedule format" });
    }

    if (!title || !description || !category || pricePerPerson === undefined) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    if (!location || !location.city || !location.state || !location.country) {
      return res.status(400).json({
        message: "Location must include city, state, and country",
      });
    }

    if (!Array.isArray(schedule) || schedule.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one schedule slot is required" });
    }

    const results = await Promise.all(req.files.map(uploadToCloudinary));
    const images = results.map((r) => r.secure_url);

    const formattedSchedule = schedule.map((slot) => ({
      date: slot.date,
      startTime: slot.startTime,
      durationMinutes: slot.durationMinutes,
      totalSpots: slot.totalSpots,
      spotsLeft: slot.totalSpots,
    }));

    const experience = await Experience.create({
      host: req.user.id,
      title,
      description,
      category,
      images,
      pricePerPerson: Number(pricePerPerson),
      location,
      schedule: formattedSchedule,
    });

    return res.status(201).json({
      message: "Experience created successfully",
      experience,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Create experience error:", error);
    return res.status(500).json({ message: "Failed to create experience" });
  }
};

const allExperiences = async (req, res) => {
  try {
    const {
      search,
      city,
      minPrice,
      maxPrice,
      spotsLeft,
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
          category: {
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
      filter.pricePerPerson = {};

      if (minPrice) {
        filter.pricePerPerson.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.pricePerPerson.$lte = Number(maxPrice);
      }
    }

    if (spotsLeft) {
      filter.schedule = {
        $elemMatch: {
          spotsLeft: {
            $gte: Number(spotsLeft),
          },
        },
      };
    }

    let sortOption = {};

    if (sort === "price_asc") {
      sortOption.pricePerPerson = 1;
    }

    if (sort === "price_desc") {
      sortOption.pricePerPerson = -1;
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip = (pageNumber - 1) * limitNumber;

    const totalExperiences = await Experience.countDocuments(filter);

    const experiences = await Experience.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    return res.status(200).json({
      experiences,
      count: experiences.length,
      totalExperiences,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalExperiences / limitNumber),
    });
  } catch (error) {
    console.log("Error fetching experiences", error);

    return res.status(500).json({
      message: "Failed to fetch experiences",
    });
  }
};

const getExperience = async (req, res) => {
  try {
    const { id } = req.params;

    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json({
        message: "Experience not found",
      });
    }

    return res.status(200).json({
      message: "Experience found",
      experience,
    });
  } catch (error) {
    console.log("Error fetching experience", error);

    return res.status(500).json({
      message: "Failed to fetch experience",
    });
  }
};


const editExperience = async (req, res) => {
    const uploadedPublicIds = [];
    let databaseSaved = false;

    try {
        const experience = req.experience;

        // ========================================= 
        // 1. HELPER FOR JSON PARSING
        // =========================================

        const parseField = (value, fallback) => {
            if (value === undefined) return fallback;

            if (typeof value === "string") {
                return JSON.parse(value);
            }

            return value;
        };

        // =========================================
        // 2. GET EXISTING IMAGES
        // =========================================

        let existingImages = parseField(
            req.body.existingImages,
            experience.images
        );

        if (!Array.isArray(existingImages)) {
            existingImages = [existingImages];
        }

        // Check whether submitted images belong to this experience

        const validImages = existingImages.every((image) =>
            experience.images.includes(image)
        );

        if (!validImages) {
            return res.status(400).json({
                message: "Invalid existing images",
            });
        }

        const totalImages =
            existingImages.length + (req.files?.length || 0);

        if (totalImages < 1 || totalImages > 10) {
            return res.status(400).json({
                message: "An experience must have between 1 and 10 images",
            });
        }

        // =========================================
        // 3. GET EXPERIENCE DETAILS
        // =========================================

        const {
            title,
            description,
            category,
            pricePerPerson,
        } = req.body;

        // =========================================
        // 4. PARSE LOCATION AND SCHEDULE
        // =========================================

        const location = parseField(
            req.body.location,
            null
        );

        const schedule = parseField(
            req.body.schedule,
            experience.schedule.map((slot) => slot.toObject())
        );

        if (!Array.isArray(schedule) || schedule.length === 0) {
            return res.status(400).json({
                message: "At least one schedule slot is required",
            });
        }

        if (location !== null && (
            typeof location !== "object" ||
            Array.isArray(location)
        )) {
            return res.status(400).json({
                message: "Invalid location",
            });
        }

        // =========================================
        // 5. VALIDATE AND MAP EXISTING SLOTS
        // ========================================= 

        const oldSlots = experience.schedule;

        const oldSlotMap = new Map(
            oldSlots.map((slot) => [
                slot._id.toString(),
                slot,
            ])
        );

        const oldSlotIds = oldSlots.map((slot) => slot._id);

        // =========================================
        // 6. GET ALL BOOKINGS
        // =========================================

        const existingBookings = await ExperienceBooking.find({
            experience: experience._id,
            slotId: { $in: oldSlotIds },
        }).select("slotId participants status paymentStatus");

        // =========================================
        // 7. CREATE BOOKING MAP
        // =========================================

        const bookingMap = new Map();

        for (const booking of existingBookings) {

            const slotId = booking.slotId.toString();

            if (!bookingMap.has(slotId)) {
                bookingMap.set(slotId, {
                    hasBooking: true,
                    bookedParticipants: 0,
                });
            }

            // Cancelled or refunded bookings don't consume capacity

            if (
                booking.status !== "cancelled" &&
                booking.paymentStatus !== "refunded"
            ) {
                const bookingInfo = bookingMap.get(slotId);

                bookingInfo.bookedParticipants += booking.participants;
            }
        }

        // =========================================
        // 8. GET SUBMITTED EXISTING SLOT IDS
        // =========================================

        const submittedSlotIds = schedule
            .filter((slot) => slot._id)
            .map((slot) => slot._id.toString());

        // Prevent duplicate IDs in submitted schedule
 
        if (new Set(submittedSlotIds).size !== submittedSlotIds.length) {
            return res.status(400).json({
                message: "Duplicate schedule slot IDs are not allowed",
            });
        }

        // =========================================
        // 9. FIND SLOTS TO DELETE
        // =========================================

        const slotsToDelete = oldSlots.filter(
            (oldSlot) =>
                !submittedSlotIds.includes(oldSlot._id.toString())
        );

        // =========================================
        // 10. PREVENT DELETING BOOKED SLOTS
        // =========================================

        for (const slot of slotsToDelete) {

            const slotId = slot._id.toString();

            const bookingInfo = bookingMap.get(slotId);

            if (bookingInfo?.hasBooking) {
                return res.status(400).json({
                    message: "You cannot delete a slot that has booking history",
                });
            }
        }

        // =========================================
        // 11. PREVENT DELETING PAST SLOTS
        // =========================================

        const startOfToday = new Date();

        startOfToday.setHours(0, 0, 0, 0);

        for (const slot of slotsToDelete) {

            if (new Date(slot.date) < startOfToday) {
                return res.status(400).json({
                    message: "Past schedule slots cannot be deleted",
                });
            }
        }

        // =========================================
        // 12. FORMAT AND VALIDATE SCHEDULE
        // =========================================

        const formattedSchedule = schedule.map((slot) => {

            // Validate basic slot information

            const date = new Date(slot.date);
            const durationMinutes = Number(slot.durationMinutes);
            const totalSpots = Number(slot.totalSpots);

            if (
                !slot.date ||
                Number.isNaN(date.getTime()) ||
                typeof slot.startTime !== "string" ||
                !slot.startTime.trim() ||
                !Number.isInteger(durationMinutes) ||
                durationMinutes < 1 ||
                !Number.isInteger(totalSpots) ||
                totalSpots < 1
            ) {
                throw new Error("Invalid schedule slot information");
            }

            // -------------------------------------
            // CASE 1: NEW SLOT
            // -------------------------------------

            if (!slot._id) {
                return {
                    date,
                    startTime: slot.startTime,
                    durationMinutes,
                    totalSpots,
                    spotsLeft: totalSpots,
                };
            }

            // -------------------------------------
            // CASE 2: EXISTING SLOT
            // -------------------------------------

            const slotId = slot._id.toString();

            const existingSlot = oldSlotMap.get(slotId);

            if (!existingSlot) {
                throw new Error("Invalid schedule slot ID");
            }

            const bookingInfo = bookingMap.get(slotId);

            // -------------------------------------
            // CASE 3: EXISTING SLOT WITH BOOKINGS
            // -------------------------------------  

            if (bookingInfo?.hasBooking) {

                const bookedParticipants =
                    bookingInfo.bookedParticipants;

                if (totalSpots < bookedParticipants) {
                    throw new Error(
                        "Capacity cannot be less than already booked participants"
                    );
                }

                return {
                    _id: existingSlot._id,

                    // Preserve existing booked slot details

                    date: existingSlot.date,
                    startTime: existingSlot.startTime,
                    durationMinutes: existingSlot.durationMinutes,

                    // Allow capacity changes

                    totalSpots,

                    spotsLeft: totalSpots - bookedParticipants,
                };
            }

            // -------------------------------------
            // CASE 4: EXISTING SLOT WITHOUT BOOKINGS
            // -------------------------------------

            return {
                _id: existingSlot._id,
                date,
                startTime: slot.startTime,
                durationMinutes,
                totalSpots,
                spotsLeft: totalSpots,
            };
        });

        // =========================================
        // 13. UPLOAD NEW IMAGES TO CLOUDINARY
        // =========================================

        const newImageUrls = [];

        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

                const result = await new Promise((resolve, reject) => {

                    cloudinary.uploader.upload_stream(
                        {
                            folder: "stayora/experiences",
                        },
                        (error, result) => {

                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        }
                    ).end(file.buffer);
                });

                newImageUrls.push(result.secure_url);

                uploadedPublicIds.push(result.public_id);
            }
        }

        // =========================================
        // 14. PREPARE FINAL IMAGES
        // =========================================

        const finalImages = [
            ...existingImages,
            ...newImageUrls,
        ];

        // =========================================
        // 15. UPDATE EXPERIENCE DETAILS
        // =========================================

        if (title !== undefined) {
            experience.title = title;
        }

        if (description !== undefined) {
            experience.description = description;
        }

        if (category !== undefined) {
            experience.category = category;
        }

        if (pricePerPerson !== undefined) {

            const price = Number(pricePerPerson);

            if (!Number.isFinite(price) || price < 0) {
                return res.status(400).json({
                    message: "Invalid experience price",
                });
            }

            experience.pricePerPerson = price;
        }

        // =========================================
        // 16. UPDATE LOCATION
        // =========================================

        if (location !== null) {

            experience.location = {
                ...experience.location.toObject(),
                ...location,
            };
        }

        // =========================================
        // 17. UPDATE SCHEDULE AND IMAGES
        // =========================================

        experience.schedule = formattedSchedule;

        experience.images = finalImages;

        // =========================================
        // 18. SAVE EXPERIENCE
        // =========================================

        await experience.save();

        databaseSaved = true;

        // =========================================
        // 19. SUCCESS RESPONSE
        // =========================================

        return res.status(200).json({
            message: "Experience updated successfully",
            experience,
        });

    } catch (error) {

        console.log("Error updating experience:", error);

        // =========================================
        // 20. CLEANUP NEW CLOUDINARY UPLOADS
        // IF DATABASE SAVE FAILED
        // =========================================

        if (!databaseSaved && uploadedPublicIds.length > 0) {

            await Promise.allSettled(
                uploadedPublicIds.map((publicId) =>
                    cloudinary.uploader.destroy(publicId)
                )
            );
        }

        return res.status(error.statusCode || 400).json({
            message: error.message || "Failed to update experience",
        });
    }
};




module.exports = {
  createExperience,
  allExperiences,
  getExperience,
  editExperience
};
