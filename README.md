# Blogz Backend

Blogz is a comprehensive blogging platform that aims to blend the best features of Medium and Hashnode. This repository contains the backend code for the Blogz application, implemented using Node.js, Prisma ORM, and PostgreSQL.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Middlewares](#middlewares)
- [Controllers](#controllers)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Authentication**: Secure user authentication with JWT, including registration, login, logout, and email verification.
- **OAuth Integration**: Support for Google OAuth to simplify user onboarding.
- **User Profiles**: Users can update their profiles with information like bio, skills, social handles, etc.
- **Blog Posts**: Create, read, update, and delete blog posts with rich content and images.
- **Tags and Categories**: Organize posts with tags for better discoverability.
- **Comments and Likes**: Users can comment on and like posts to increase engagement.
- **Analytics**: Track post views and other metrics to understand content performance.
- **Rate Limiting**: Prevent abuse with rate limiting for API requests.
- **Caching**: Improve performance with Redis caching for frequently accessed data.
- **Password Reset**: Secure password reset functionality via email.
- **Role-Based Access**: Different roles (user, admin) with appropriate permissions.

## Tech Stack

- **Backend Framework**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JSON Web Tokens (JWT)
- **Email Service**: Nodemailer for sending emails
- **Caching**: Redis for caching frequently accessed data
- **Rate Limiting**: Custom rate limiting middleware
- **Validation**: Zod for schema validation
- **Password Encryption**: Bcrypt for hashing passwords
- **OAuth Integration**: Google OAuth for user authentication

## Installation

**Prerequisites**
- Node.js installed on your machine
- PostgreSQL database
- Redis server (optional for caching)

**Steps**
1. Clone the repository:
    ```
    git clone https://github.com/Joeljaison391/Blogz-Backend.git
    ```

2. Navigate to the project directory:
    ```
    cd <project_directory>
    ```

3. Install dependencies:
    ```
    npm install
    ```

4. Set up environment variables:
    Create a `.env` file in the root directory and define the following variables:
    ```
    DATABASE_URL=your_postgresql_database_url
    REDIS_URL=your_redis_server_url (optional for caching)
    EMAIL_USER=your_email_service_username
    EMAIL_PASSWORD=your_email_service_password
    JWT_SECRET_KEY=your_jwt_secret_key
    ```

5. Run database migrations:
    ```
    npx prisma migrate dev
    ```

6. Start the server:
    ```
    npm start
    ```

### 5. Environment Variables

Environment variables are used to configure various aspects of the application, such as database connection, authentication tokens, and external services. These variables are stored in a `.env` file in the root directory of the project.

Here are the environment variables used in the project:

- `DATABASE_URL`: The URL of your PostgreSQL database.
- `REDIS_URL`: The URL of your Redis server (optional, used for caching).
- `EMAIL_USER`: Your email service username for sending emails (e.g., Gmail).
- `EMAIL_PASSWORD`: Your email service password.
- `JWT_SECRET_KEY`: Secret key used to sign JWT tokens for authentication.

Make sure to set these variables correctly according to your development or production environment.

### 6. Database Schema

The database schema is defined using Prisma, a modern database toolkit. It consists of several entities that represent different aspects of the application, such as users, posts, comments, likes, analytics, and more.

Here's an overview of the main entities in the database schema:

- **User**: Represents a user of the platform, with attributes such as username, email, password hash, role, avatar URL, and more. Users can author posts, leave comments, and interact with other users.
- **Post**: Represents a blog post created by a user, containing attributes like title, content, publish date, author, tags, comments, and likes.
- **Comment**: Represents a comment left by a user on a post, containing the comment content, post ID, user ID, and optional parent comment ID for nested comments.
- **Like**: Represents a like given by a user to a post.
- **Analytics**: Contains analytics data for each post, such as the number of views.
- **Tag**: Represents a tag associated with a post.
- **RouteAnalytics**: Stores analytics data for different routes in the application.
- **LoginLog**: Records login activities of users, including the user ID, timestamp, IP address, device, and location.
- **Session**: Manages user sessions, storing session data, user ID, expiration time, IP address, and user agent.

## Table Relationships

The entities in the database schema have relationships with each other, enabling complex data querying and retrieval. Here are the table relationships in the schema:

- A user can have multiple posts, comments, likes, and login logs.
- A post belongs to a user and can have multiple comments, likes, and tags.
- A comment belongs to a user and a post, and can have multiple child comments.
- A like belongs to a user and a post.
- Analytics data is associated with a post.
- A tag is associated with multiple posts.
- Route analytics data is associated with different routes in the application.
- A session is associated with a user.

### 7. API Endpoints

Here are the main API endpoints available:

- **User Registration**: Endpoint for registering new users.
    - Method: POST
    - Route: `/api/v2/auth/user/register`
    - Request Body:
        ```json
        {
            "username": "string",
            "email": "string",
            "password": "string"
        }
        ```
    - Response:
        ```json
        {
            "message": "User registered successfully"
        }
        ```

- **User Login**: Endpoint for user authentication and login.
    - Method: POST
    - Route: `/api/v2/auth/user/login`
    - Request Body:
        ```json
        {
            "email": "string",
            "password": "string"
        }
        ```
    - Response:
        ```json
        {
            "accessToken": "string",
            "refreshToken": "string"
        }
        ```

- **User Logout**: Endpoint for user logout.
    - Method: POST
    - Route: `/api/v2/auth/user/logout`
    - Response:
        ```json
        {
            "message": "User logged out successfully"
        }
        ```

- **Refresh Token**: Endpoint for refreshing authentication tokens.
    - Method: POST
    - Route: `/api/v2/auth/user/refresh`
    - Request Body:
        ```json
        {
            "refreshToken": "string"
        }
        ```
    - Response:
        ```json
        {
            "accessToken": "string"
        }
        ```

- **Reset Password Request**: Endpoint for requesting a password reset.
    - Method: POST
    - Route: `/api/v2/auth/user/request-password-reset`
    - Request Body:
        ```json
        {
            "email": "string"
        }
        ```
    - Response:
        ```json
        {
            "message": "Password reset email sent"
        }
        ```

- **Reset Password**: Endpoint for resetting the user's password.
    - Method: POST
    - Route: `/api/v2/auth/user/reset-password`
    - Request Body:
        ```json
        {
            "email": "string",
            "password": "string",
            "resetToken": "string"
        }
        ```
    - Response:
        ```json
        {
            "message": "Password reset successful"
        }
        ```

- **Request Email Verification**: Endpoint for requesting email verification.
    - Method: POST
    - Route: `/api/v2/auth/user/request-email-verification`
    - Request Body:
        ```json
        {
            "email": "string"
        }
        ```
    - Response:
        ```json
        {
            "message": "Email verification link sent"
        }
        ```

- **Verify Email**: Endpoint for verifying user email addresses.
    - Method: POST
    - Route: `/api/v2/auth/user/verify-email`
    - Request Body:
        ```json
        {
            "email": "string",
            "verificationToken": "string"
        }
        ```
    - Response:
        ```json
        {
            "message": "Email verified successfully"
        }
        ```

- **Get User by Email**: Endpoint for retrieving user information by email.
    - Method: GET
    - Route: `/api/v2/auth/user/get-user-by-email`
    - Response:
        ```json
        {
            "username": "string",
            "email": "string",
            "createdAt": "string",
            "updatedAt": "string"
        }
        ```

- **Update User**: Endpoint for updating user details.
    - Method: PUT
    - Route: `/api/v2/user/update`
    - Request Body:
        ```json
        {
            "username": "string",
            "email": "string"
        }
        ```
    - Response:
        ```json
        {
            "message": "User updated successfully"
        }
        ```

### 8. Middlewares

- **Async Handler**: Middleware for handling asynchronous route handlers.
  - Description: Wraps route handlers to catch any asynchronous errors and pass them to the error handling middleware.
  - Usage: Used to simplify error handling in asynchronous route handlers.
  
- **Authentication Middleware**: Middleware for verifying authentication tokens.
  - Description: Validates authentication tokens sent by clients to authenticate and authorize requests.
  - Usage: Applied to routes that require authentication to access.

- **Error Handling Middleware**: Middleware for handling errors.
  - Description: Catches and formats errors that occur during request processing and sends appropriate error responses to clients.
  - Usage: Applied globally to handle errors across all routes.

- **Rate Limiting Middleware**: Middleware for rate limiting requests.
  - Description: Limits the number of requests that can be made to certain routes within a specified time window to prevent abuse or excessive usage.
  - Usage: Applied to routes that need rate limiting to protect against abuse or excessive requests.

### 9. Controllers

Controllers handle the business logic of the application by interacting with the data layer and processing incoming requests. Here are the main controllers used in the project:

- **User Controller**: Manages user-related operations such as user registration, login, logout, password reset, email verification, and user profile updates.
  - Description: Handles user authentication, registration, and profile management functionalities.
  - Usage: Responsible for processing user requests related to authentication and profile management.

- **Post Controller**: Handles post-related operations such as creating, updating, retrieving, and deleting posts.
  - Description: Manages the lifecycle of posts, including creation, editing, deletion, and retrieval.
  - Usage: Used to handle requests related to posts, such as creating new posts, updating existing ones, and fetching post details.

- **Comment Controller**: Manages comment-related operations such as adding, retrieving, updating, and deleting comments on posts.
  - Description: Handles interactions related to comments, including adding new comments, updating existing ones, and fetching comments for a post.
  - Usage: Responsible for processing requests related to comments on posts.

- **Like Controller**: Handles like-related operations such as adding or removing likes on posts.
  - Description: Manages user interactions with posts, including liking or unliking posts.
  - Usage: Used to process requests related to liking or unliking posts.

- **Analytics Controller**: Manages analytics-related operations such as tracking views on posts.
  - Description: Handles tracking and reporting of post views and other analytics data.
  - Usage: Used to record and retrieve analytics data for posts.

## Contributing

Contributions to this project are welcome and encouraged! Here's how you can contribute:

1. **Fork the Repository**: Click the "Fork" button at the top right corner of this repository to create your copy.

2. **Clone the Repository**: Clone your forked repository to your local machine using the `git clone` command.

    ```bash
    git clone https://github.com/your-username/your-forked-repo.git
    ```

3. **Create a Branch**: Create a new branch to work on your changes.

    ```bash
    git checkout -b feature/your-feature-name
    ```

4. **Make Changes**: Make the necessary changes to the codebase.

5. **Commit Changes**: Commit your changes with a descriptive commit message.

    ```bash
    git commit -m "Add your commit message here"
    ```

6. **Push Changes**: Push your changes to your forked repository.

    ```bash
    git push origin feature/your-feature-name
    ```

7. **Create a Pull Request**: Go to the original repository and create a pull request with your changes.

8. **Review and Merge**: Collaborate with the project maintainers to review and merge your changes into the main branch.

9. **Celebrate**: Congratulations! You have successfully contributed to the project. Thank you for your contribution!


### Important Links

- [Front-end Repository](https://github.com/Joeljaison391/Blogz): Repository for the front-end of Blogz.
- [Blogz App](https://bloggzz.vercel.app/): Visit the live Blogz application.
- [Postman API Documentation](https://documenter.getpostman.com/view/24899630/2sA3XMj3wX): Explore the API endpoints with Postman.
