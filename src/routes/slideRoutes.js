const express = require('express');
const {
  getSlides,
  getSlideById,
  createSlide,
  updateSlide,
  deleteSlide,
} = require('../controllers/slideController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getSlides);
router.get('/:id', getSlideById);

// Protected routes — `protect` runs first and attaches req.user
router.post('/', protect, createSlide);
router.put('/:id', protect, updateSlide);
router.delete('/:id', protect, deleteSlide);

module.exports = router;
