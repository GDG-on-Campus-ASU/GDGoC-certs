# **GitHub Copilot: GDGoC Certificate Generator Project**

## **Project Goal**

Build a full-stack, self-hosted web application for Google Developer Groups on Campus (GDGoC). The app allows authenticated leaders to generate certificates, provides a public validation page, and is deployed entirely with Docker.

## **Tech Stack**

* **Frontend:** React (using Vite)  
* **Backend:** **Custom API (Node.js w/ Express or FastAPI)**  
* **Database:** **PostgreSQL**  
* **Containerization:** Docker & Docker Compose  
* **Reverse Proxy:** **Nginx Proxy Manager** (for all ingress and SSL)  
* **Email:** Brevo (formerly Sendinblue) for SMTP.  
* **Auth Provider:** authentik (as OIDC provider)

## **Project Structure & Branching**

* **`main` Branch:** This branch should contain only the project source code for the `frontend` (React) and `backend` (Node.js) applications.  
* **`deployment` Branch:** A separate branch (e.g., `deployment` or `docker-setup`) will be created. This branch will contain:  
  * The root `docker-compose.yml` file.  
  * The `frontend/Dockerfile` and `frontend/nginx.conf`.  
  * The `backend/Dockerfile`.  
  * Any other deployment-specific scripts or configurations.  
* **Guidance:** Please provide instructions for both branches. First, help me build the applications on `main`. Then, show me how to create and set up the `deployment` branch with all the necessary Docker files.

## **Feature Breakdown**

### **1\. Custom Backend & Database Setup (Docker)**

* **Project Structure:** Guide me in setting up a monorepo or two separate folders: `frontend` (for React) and `backend` (for Node.js/Express). This structure will exist on the `main` branch.  
* **`docker-compose.yml`:** (To be created on `deployment` branch) Create a `docker-compose.yml` that defines our application stack:  
  * `db`: A standard `postgres` service. Guide me on setting up a volume for persistent data and environment variables for `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`.  
  * `backend`: Our custom Node.js/Express API service. It should be built from a `Dockerfile` in the `backend` folder. It will need environment variables for the database connection and Brevo API key.  
  * `frontend`: An `nginx` service to serve the static React build. It should be built from a `Dockerfile` in the `frontend` folder.  
* **Networking:**  
  * **No `ports`:** None of these services should expose ports to the host.  
  * **Docker Network:** Ensure all services are on the same custom Docker network (e.g., `gdgoc-net`) so they can communicate.  
  * **Nginx Proxy Manager:** Add a note that I will use Nginx Proxy Manager (running separately) to point public domains to the services on this `gdgoc-net` network:  
    * `sudo.certs-admin.certs.gdg-oncampus.dev` \-\> `frontend` service (port 80\)  
    * `certs.gdg-oncampus.dev` \-\> `frontend` service (port 80\)  
    * `api.certs.gdg-oncampus.dev` \-\> `backend` service (e.g., port 3001\)  
* **Backend CORS:** Guide me on setting up CORS in the backend API to *only* accept requests from `https://sudo.certs-admin.certs.gdg-oncampus.dev` and `https://certs.gdg-oncampus.dev`.  
* **Database Schema:** Provide the plain SQL `CREATE TABLE` statements for the PostgreSQL database:  
  * **`allowed_leaders`**:  
    * `ocid` (text, primary key): The unique "OCID" from authentik.  
    * `name` (text): Leader's full name (e.g., `{Issuer_Name}`). **This can be updated by the user.**  
    * `email` (text, unique): Leader's email.  
    * `org_name` (text, nullable): The leader's org. **This is set once on first login.**  
    * `can_login` (boolean, default: true): To enable/disable access.  
  * **`certificates`**: (Schema is unchanged)  
    * `id` (uuid, primary key, default: `gen_random_uuid()`)  
    * `unique_id` (text, unique)  
    * `recipient_name` (text, not null)  
    * `recipient_email` (text)  
    * `event_type` (text, not null): 'workshop' or 'course'.  
    * `event_name` (text, not null)  
    * `issue_date` (date, default: `now()`)  
    * `issuer_name` (text, not null)  
    * `org_name` (text, not null)  
    * `generated_by` (text): The OCID of the leader.  
    * `pdf_url` (text, nullable)

### **2\. Authentication (Custom API \+ authentik)**

* **OIDC Provider Setup (authentik):**  
  * (This part is the same) I will configure authentik as an OIDC provider.  
* **Backend JWT Validation:**  
  * Guide me on setting up the Node.js/Express backend to validate JWTs from authentik on protected API routes.  
* **Frontend App Routing (Hostname-Based):**  
  * Guide me on setting up the **root component (e.g., `App.jsx`)** of the React application to check `window.location.hostname`.  
  * **If `window.location.hostname === 'sudo.certs-admin.certs.gdg-oncampus.dev'`:**  
    * Render the `<AdminApp />` component (which contains the protected admin routes, login page, settings, etc.).  
  * **If `window.location.hostname === 'certs.gdg-oncampus.dev'`:**  
    * Render *only* the `<PublicValidationPage />` component.  
  * This ensures the admin login and dashboard are completely inaccessible from the public validation domain.  
* **Admin Login Flow (for `sudo.certs-admin.certs.gdg-oncampus.dev`):**  
  * **Frontend (`/login`):** A login page that redirects the user to the authentik login URL.  
  * **Callback:** After login, authentik redirects back to `/auth/callback`.  
  * **Frontend (Callback):** The React app grabs the JWT and calls the backend endpoint `POST /api/auth/login`.  
  * **Backend (`POST /api/auth/login`):**  
    * This endpoint is protected by JWT validation.  
    * Decodes the JWT to get `ocid`, `name`, `email`, and `groups` claims.  
    * **Check 1 (Group):** If `groups` does **not** include "GDGoC-Admins", return `403 Forbidden`.  
    * **Check 2 (Provisioning):**  
      * Query `allowed_leaders` by `ocid`.  
      * **Case A (User Exists):** If `can_login` is `false`, return `403 Forbidden`. Return user data.  
      * **Case B (User NOT Exists):** `INSERT` new leader with `org_name` as `NULL`. Return new user data.  
  * **Frontend (Handling Login):**  
    * Store the JWT securely.  
    * Based on API response:  
      * If `org_name` is `null`, redirect to `/profile-setup`.  
      * If `org_name` is present, redirect to `/admin`.  
* **Protected Routes:**  
  * (Unchanged) Create protected routes in React (for the admin app) and in the backend API.

### **3\. Profile Setup & Settings**

(This section is unchanged and is part of the Admin App)

* **A. One-Time Setup Page (`/profile-setup`)**  
* **B. Settings Page (`/admin/settings`)**

### **4\. Certificate Template Component**

(This section is unchanged)

* **Certificate Asset (`.ai` file):** Convert to SVG.  
* **React Component (`CertificateTemplate.jsx`):** Build the component.

### **5\. Admin Dashboard (`/admin`)**

(This section is unchanged and is part of the Admin App)

* **A. Single Certificate Generation:** Form and API call.  
* **B. Bulk CSV Upload:** CSV parser and API call.  
* **C. Download CSV Template:** Button for `bulk_template.csv`.

### **6\. Emailing with Brevo (SMTP)**

(This section is unchanged)

* **Secure SMTP Credentials:** Use environment variables in `docker-compose.yml` for the `backend` service.  
* **Backend Email Service:** Create a module (`emailService.js`) to send email via Brevo.

### **7\. Public Validation Page (`/`)**

* **Hostname:** This page is the **only** component rendered when the site is accessed via `certs.gdg-oncampus.dev`.  
* **Simple UI:** A single text input field and a "Validate" button.  
* **Logic:**  
  1. User enters a `unique_id`.  
  2. Frontend calls the **public** backend endpoint: `GET /api/validate/{unique_id}`.  
  3. **Backend:** Queries the `certificates` table. Returns 404 if not found, or the data if found.  
  4. **Frontend:** Displays the success/error message.

### **8\. Dockerfiles & Deployment**

(These files will live on the `deployment` branch)

* **Goal:** Provide the `Dockerfile` for both the frontend and backend.  
* **`backend/Dockerfile`:**  
  * (Unchanged) Multi-stage `Dockerfile` for the Node.js app.  
  * **CORS Note:** Remind me to implement the CORS policy here, allowing only the two specific hostnames.  
* **`frontend/Dockerfile`:**  
  * (Unchanged) Multi-stage `Dockerfile` (Build Stage \+ Nginx Stage).  
* **`frontend/nginx.conf`:**  
  * (Unchanged) Basic `nginx.conf` to serve the React SPA (redirecting all 404s to `index.html`).  
* **React Environment Variables:**  
  * Show how to pass the public API URL (e.g., `https'://api.my-domain.com`) to the React app as `VITE_API_URL` during its Docker build (using a build argument).

