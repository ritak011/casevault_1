const mongoose = require('mongoose');

/**
 * Slide Schema
 * Mirrors the metadata captured by the frontend Upload form exactly:
 * title, description, tags/category, preview image, slide file URL,
 * competition name, year, and a reference back to the uploader.
 */
const slideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description / executive summary is required'],
      trim: true,
    },
    tags: {
      // Stored as an array so a slide can belong to multiple tags,
      // but the frontend's single "category" dropdown maps to tags[0].
      type: [String],
      required: [true, 'At least one tag/category is required'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'tags must be a non-empty array',
      },
    },
    previewImageUrl: {
      type: String,
      required: [true, 'Preview image URL is required'],
    },
    slideUrl: {
      type: String,
      required: [true, 'Slide file URL is required'],
    },
    competitionName: {
      type: String,
      required: [true, 'Competition name is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Helpful for fast text search on title/description (used by GET /api/slides?search=)
slideSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Slide', slideSchema);
