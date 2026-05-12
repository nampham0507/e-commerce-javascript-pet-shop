# E-Commerce Pet Shop - Backend Setup

## MongoDB Connection Guide

### Prerequisites

1. **Node.js** - Download from [nodejs.org](https://nodejs.org)
2. **MongoDB** - Install from [mongodb.com](https://www.mongodb.com/try/download/community)

### Installation Steps

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure MongoDB**
   - Start MongoDB service
   - On Windows: MongoDB should be running as a service after installation
   - On Mac/Linux: Run `mongod` in terminal

3. **Update `.env` file**

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/petshop
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_here
   ```

   If using MongoDB Atlas (Cloud):

   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/petshop?retryWrites=true&w=majority
   ```

4. **Start the Server**

   ```bash
   npm start          # Production mode
   npm run dev        # Development mode with nodemon
   ```

   You should see:

   ```
   ✓ MongoDB connected successfully
   ✓ Server running on port 5000
   ```

### API Endpoints

#### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

#### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:category` - Get products by category
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Database Models

1. **User** - Stores user account information
2. **Product** - Stores pet shop products
3. **Order** - Stores customer orders
4. **Customer** - Stores customer profile data

### Example API Calls

**Register User:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Create Product:**

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dog Food",
    "category": "dogs",
    "price": 25.99,
    "quantity": 100,
    "description": "Premium dog food"
  }'
```

### Troubleshooting

- **MongoDB connection failed**: Ensure MongoDB service is running
- **Port already in use**: Change PORT in `.env` file
- **Module not found**: Run `npm install` again
- **Authentication errors**: Check JWT_SECRET in `.env`

### Next Steps

Uncomment the route imports in `server.js`:

```javascript
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
// app.use('/api/orders', require('./routes/orderRoutes'));
// app.use('/api/customers', require('./routes/customerRoutes'));
```

Create similar route files for Orders and Customers based on the examples provided.
