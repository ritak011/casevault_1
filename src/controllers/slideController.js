const Slide = require('../models/Slide');
const asyncHandler = require('../utils/asyncHandler');

const REQUIRED_FIELDS = [
  'title',
  'description',
  'tags',
  'previewImageUrl',
  'slideUrl',
  'competitionName',
  'year',
];

/**
 * @route   GET /api/slides
 * @access  Public
 * Query params:
 *   page      (default 1)
 *   limit     (default 10)
 *   search    matches title/description (case-insensitive)
 *   category  matches a single tag, e.g. ?category=Strategy
 *   sort      'latest' (default) | 'oldest' | 'most-viewed'
 */
const getSlides = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
  const { search, category } = req.query;

  const filter = {};

  if (category && category !== 'All') {
    filter.tags = category; // matches if `category` is one of the tags in the array
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Sorting
  let sortOption = { createdAt: -1 }; // 'latest' default
  if (req.query.sort === 'oldest') sortOption = { createdAt: 1 };
  if (req.query.sort === 'most-viewed') sortOption = { views: -1 };

  const total = await Slide.countDocuments(filter);
  const slides = await Slide.find(filter)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('uploadedBy', 'name email');

  res.json({
    success: true,
    data: slides,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/**
 * @route   GET /api/slides/:id
 * @access  Public
 */
const getSlideById = asyncHandler(async (req, res) => {
  const slide = await Slide.findById(req.params.id).populate(
    'uploadedBy',
    'name email'
  );

  if (!slide) {
    res.status(404);
    throw new Error('Slide not found');
  }

  res.json({ success: true, data: slide });
});

/**
 * @route   POST /api/slides
 * @access  Protected (requires JWT)
 * Validates that all required fields from the upload form are present.
 */
const createSlide = asyncHandler(async (req, res) => {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    res.status(400);
    throw new Error(`Missing required field(s): ${missing.join(', ')}`);
  }

  // Normalize tags: accept either an array or a single category string
  const tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];

  const slide = await Slide.create({
    title: req.body.title,
    description: req.body.description,
    tags,
    previewImageUrl: req.body.previewImageUrl,
    slideUrl: req.body.slideUrl,
    competitionName: req.body.competitionName,
    year: req.body.year,
    uploadedBy: req.user._id, // set from the authenticated user, never trust client input here
  });

  res.status(201).json({ success: true, data: slide });
});

/**
 * @route   PUT /api/slides/:id
 * @access  Protected (requires JWT) — only the original uploader may update
 */
const updateSlide = asyncHandler(async (req, res) => {
  const slide = await Slide.findById(req.params.id);

  if (!slide) {
    res.status(404);
    throw new Error('Slide not found');
  }

  if (slide.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized — you can only update slides you uploaded');
  }

  const updatableFields = [
    'title',
    'description',
    'tags',
    'previewImageUrl',
    'slideUrl',
    'competitionName',
    'year',
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      slide[field] = field === 'tags' && !Array.isArray(req.body.tags)
        ? [req.body.tags]
        : req.body[field];
    }
  });

  const updated = await slide.save();
  res.json({ success: true, data: updated });
});

/**
 * @route   DELETE /api/slides/:id
 * @access  Protected (requires JWT) — only the original uploader may delete
 */
const deleteSlide = asyncHandler(async (req, res) => {
  const slide = await Slide.findById(req.params.id);

  if (!slide) {
    res.status(404);
    throw new Error('Slide not found');
  }

  if (slide.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized — you can only delete slides you uploaded');
  }

  await slide.deleteOne();
  res.json({ success: true, data: { id: req.params.id } });
});


// 1. UPDATE SLIDE METADATA
exports.updateSlide = async (req, res) => {
  try {
    const slide = await Slide.findById(req.params.id);

    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    // Optional safety check: Ensure the logged-in user owns the slide
    if (slide.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to update this slide' });
    }

    const updatedSlide = await Slide.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedSlide });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// 2. DELETE A SLIDE
exports.deleteSlide = async (req, res) => {
  try {
    const slide = await Slide.findById(req.params.id);

    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    // Optional safety check: Ensure the logged-in user owns the slide
    if (slide.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this slide' });
    }

    await slide.deleteOne();
    res.status(200).json({ success: true, message: 'Slide removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getSlides,
  getSlideById,
  createSlide,
  updateSlide,
  deleteSlide,
};
