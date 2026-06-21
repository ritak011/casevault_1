# CaseVault — Backend API

RESTful API for the CaseVault platform. Node.js + Express + MongoDB
(Mongoose). Matches the routes/schema from the recruitment task spec
exactly, and matches the request/response shapes expected by the
`casevault` frontend's `src/api/slidesApi.js`.

## Setup

```bash
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev            # nodemon, auto-restarts on file changes
# or
npm start
```

### Environment variables

| Variable         | Description                                      |
|-------------------|--------------------------------------------------|
| `PORT`            | Port the server listens on (default 5000)        |
| `MONGO_URI`       | MongoDB connection string (local or Atlas)        |
| `JWT_SECRET`      | Long random string used to sign/verify JWTs       |
| `JWT_EXPIRES_IN`  | Token lifetime, e.g. `7d`                         |
| `CLIENT_ORIGIN`   | Comma-separated allowed CORS origins              |

## Folder structure

```
src/
  server.js              # boots DB connection + HTTP server
  app.js                 # express app: middleware, route mounting, error handlers

  config/
    db.js                 # mongoose connection

  models/
    User.js                # email + bcrypt-hashed password, timestamps
    Slide.js                # title, description, tags, previewImageUrl,
                             # slideUrl, competitionName, year, uploadedBy, views

  controllers/
    authController.js       # register, login
    slideController.js      # getSlides (pagination/search/filter/sort),
                             # getSlideById, createSlide, updateSlide, deleteSlide

  routes/
    authRoutes.js            # POST /api/auth/register, /login
    slideRoutes.js            # GET/POST/PUT/DELETE /api/slides...

  middleware/
    authMiddleware.js          # protect() — verifies Bearer JWT, sets req.user
    errorMiddleware.js          # notFound + centralized errorHandler

  utils/
    generateToken.js             # signs JWTs
    asyncHandler.js               # wraps async controllers, forwards errors
```

## API reference

### Auth (public)

| Method | Path                  | Body                          |
|--------|------------------------|--------------------------------|
| POST   | `/api/auth/register`  | `{ name, email, password }`   |
| POST   | `/api/auth/login`     | `{ email, password }`         |

Both return `{ success, data: { user, token } }`.

### Slides (public read)

| Method | Path              | Query params                                              |
|--------|--------------------|-------------------------------------------------------------|
| GET    | `/api/slides`      | `page`, `limit`, `search`, `category`, `sort` (`latest`/`oldest`/`most-viewed`) |
| GET    | `/api/slides/:id`  | —                                                              |

Returns `{ success, data, pagination: { page, limit, total, totalPages } }`
for the list route, `{ success, data }` for the single-slide route.

### Slides (protected — `Authorization: Bearer <token>`)

| Method | Path              | Notes                                                  |
|--------|--------------------|----------------------------------------------------------|
| POST   | `/api/slides`     | Requires `title, description, tags, previewImageUrl, slideUrl, competitionName, year` |
| PUT    | `/api/slides/:id` | Only the original uploader can update                  |
| DELETE | `/api/slides/:id` | Only the original uploader can delete                  |

## Notes on design choices

- **Password security:** hashed via bcrypt in a Mongoose `pre('save')` hook
  on the `User` model — controllers never see or store a plaintext password,
  and `password` has `select: false` so it's excluded from queries by default.
- **Ownership checks:** `PUT`/`DELETE` compare `slide.uploadedBy` against
  `req.user._id` (set by the `protect` middleware) and return `403` if they
  don't match — not just "any logged-in user can edit anything."
- **Error handling:** controllers throw plain `Error`s after setting
  `res.status(...)`; `asyncHandler` forwards them to the centralized
  `errorHandler`, which also normalizes Mongoose `CastError`,
  `ValidationError`, and duplicate-key (11000) errors into clean JSON.
- **Search:** case-insensitive regex match against `title`/`description`.
  For a production scale-up, swap this for the Mongo `$text` index already
  declared on the `Slide` schema (`slideSchema.index({ title: 'text', ... })`).
