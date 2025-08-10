# AgriConnect - Direct Farm to Consumer Marketplace

A comprehensive platform connecting farmers directly with consumers and retailers, eliminating middlemen and ensuring fair prices.

## 🚀 Features

- **Direct Connection**: Farmers connect directly with consumers
- **Product Management**: Easy listing and management of agricultural products
- **Secure Payments**: Integrated payment processing with escrow protection
- **Real-time Messaging**: In-app communication between users
- **Analytics Dashboard**: Sales insights and performance metrics
- **Mobile Responsive**: Works seamlessly on all devices

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd agri-connect
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/agriconnect
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/agriconnect

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

## 🗄️ MongoDB Setup

### Option 1: Local MongoDB Installation

#### Windows
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install with default settings
3. Start MongoDB service:
```bash
net start MongoDB
```

#### macOS
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 2: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update your `.env` file with the Atlas connection string

### Test MongoDB Connection

```bash
node test-db.js
```

You should see:
```
✅ MongoDB Connected Successfully!
Host: localhost
Database: agriconnect
Port: 27017
✅ Connection test completed successfully!
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 📁 Project Structure

```
agri-connect/
├── models/                 # MongoDB Schemas
│   ├── User.js           # User model (farmers/consumers)
│   ├── Product.js        # Product model
│   └── Order.js          # Order model
├── routes/                # API Routes
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User management
│   ├── products.js       # Product management
│   ├── orders.js         # Order management
│   └── messages.js       # Messaging system
├── public/                # Static files
├── uploads/               # File uploads
├── server.js             # Main server file
├── package.json          # Dependencies
├── .env                  # Environment variables
└── README.md            # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order status

## 🗄️ Database Schema

### Users Collection
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  userType: 'farmer' | 'consumer' | 'retailer',
  location: {
    city: String,
    state: String,
    pincode: String
  },
  // Farmer-specific fields
  farmName: String,
  farmSize: Number,
  crops: [String],
  // Consumer-specific fields
  addresses: [Address],
  rating: Number,
  isVerified: Boolean
}
```

### Products Collection
```javascript
{
  name: String,
  description: String,
  category: String,
  farmer: ObjectId (ref: User),
  price: {
    amount: Number,
    unit: String
  },
  inventory: {
    quantity: Number,
    unit: String
  },
  images: [Image],
  status: 'active' | 'inactive' | 'out_of_stock',
  rating: {
    average: Number,
    totalReviews: Number
  }
}
```

### Orders Collection
```javascript
{
  orderNumber: String (unique),
  customer: ObjectId (ref: User),
  farmer: ObjectId (ref: User),
  items: [OrderItem],
  total: Number,
  status: 'pending' | 'confirmed' | 'delivered',
  payment: {
    method: String,
    status: String
  }
}
```

## 🔒 Security Features

- **Password Hashing**: Using bcryptjs
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Express-validator middleware
- **Rate Limiting**: API request limiting
- **CORS Protection**: Cross-origin resource sharing
- **Helmet**: Security headers

## 🧪 Testing

### Test Database Connection
```bash
node test-db.js
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123",
    "userType": "farmer",
    "location": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "farmName": "Doe Farm",
    "farmSize": 10
  }'
```

## 🚀 Deployment

### Local Development
1. Install MongoDB locally
2. Set up environment variables
3. Run `npm run dev`

### Production Deployment
1. Set up MongoDB Atlas or production MongoDB
2. Configure environment variables
3. Use PM2 or similar process manager
4. Set up reverse proxy (Nginx)
5. Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### MongoDB Connection Issues

1. **Connection Refused**
   - Ensure MongoDB is running
   - Check if port 27017 is available
   - Verify firewall settings

2. **Authentication Failed**
   - Check username/password in connection string
   - Verify database user permissions
   - For Atlas: Check IP whitelist

3. **Network Timeout**
   - Check internet connectivity
   - Verify connection string format
   - Try increasing timeout values

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   # Kill the process
   kill -9 <PID>
   ```

2. **Module Not Found**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Environment Variables Not Loading**
   - Ensure `.env` file is in root directory
   - Check file permissions
   - Verify variable names

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@agriconnect.com
- Documentation: [docs.agriconnect.com](https://docs.agriconnect.com)

---

**Made with ❤️ for the agricultural community** 