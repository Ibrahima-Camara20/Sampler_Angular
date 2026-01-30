# Sampler API

This is the backend API for the Sampler application. It provides endpoints for managing audio presets and samples.

## Cloud Deployment Configuration

When deploying to a cloud provider (Render, Vercel, Heroku, etc.), you must configure the following environment variables.

### Environment Variables

| Variable     | Description                                                  | Example / Default                                    |
| ------------ | ------------------------------------------------------------ | ---------------------------------------------------- |
| `MONGO_URI`  | **Required**. Connection string for your production MongoDB. | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `PUBLIC_DIR` | Directory for static frontend assets.                        | Default: `../public`                                 |
| `DATA_DIR`   | Directory for uploaded user content (presets).               | Default: `../public/presets`                         |

### Persistent Storage (Critical)

In most cloud environments, the filesystem is **ephemeral** (files are deleted when the server restarts). To verify uploaded samples persist, you **must use a Persistent Volume/Disk**.

1.  **Create a Disk** in your cloud dashboard (e.g., "Render Disk").
2.  **Mount Key**: Set the mount path to a folder, e.g., `/var/data/presets`.
3.  **Set Environment Variable**:
    - Key: `DATA_DIR`
    - Value: `/var/data/presets` (must match the mount path).

The application is configured to serve files from `DATA_DIR` at the URL path `/presets`.

---

## API Endpoints

### Presets

| Method   | Endpoint             | Description                                                                |
| -------- | -------------------- | -------------------------------------------------------------------------- |
| `GET`    | `/api/presets`       | List all presets. Query params: `q` (search), `type`, `factory` (boolean). |
| `GET`    | `/api/presets/:name` | Get details of a specific preset by name.                                  |
| `POST`   | `/api/presets`       | Create a new preset. Body: JSON object of preset.                          |
| `PUT`    | `/api/presets/:name` | Update/Replace an existing preset.                                         |
| `PATCH`  | `/api/presets/:name` | Partially update a preset.                                                 |
| `DELETE` | `/api/presets/:name` | Delete a preset and its folder.                                            |

### Uploads

| Method | Endpoint              | Description                                                                        |
| ------ | --------------------- | ---------------------------------------------------------------------------------- |
| `POST` | `/api/upload/:folder` | Upload an audio sample. Form-data: `file`. Path param `folder` is the preset name. |

### Samples (Sub-resources)

| Method   | Endpoint                               | Description                                          |
| -------- | -------------------------------------- | ---------------------------------------------------- |
| `Delete` | `/api/presets/:name/samples/:filename` | Delete a specific sample file from a preset.         |
| `PUT`    | `/api/presets/:name/samples/:filename` | Rename a sample file. Body: `{ "name": "newname" }`. |

### System

| Method | Endpoint      | Description                                     |
| ------ | ------------- | ----------------------------------------------- |
| `GET`  | `/api/health` | Health check. Returns `{ ok: true, now: ... }`. |
