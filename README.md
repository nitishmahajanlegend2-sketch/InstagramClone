
===========================================
SETUP INSTRUCTIONS
===========================================

1. INSTALL MONGODB
   - Download and install MongoDB Community Server from:
     https://www.mongodb.com/try/download/community
   - Start MongoDB service:
     - Windows: MongoDB service should auto-start
     - Mac: brew services start mongodb-community
     - Linux: sudo systemctl start mongod

2. CREATE PROJECT STRUCTURE
   Create a folder structure like this:
   
   instagram-clone/
   ├── server.js          (Backend server code)
   ├── package.json       (This file)
   └── public/
       └── index.html     (Frontend HTML file)

3. INSTALL DEPENDENCIES
   Open terminal in project folder and run:
   npm install

4. START THE SERVER
   npm start
   
   Or for development (auto-restart on changes):
   npm run dev

5. OPEN THE APPLICATION
   - Open your browser
   - Go to: http://localhost:3000
   - If using the HTML file separately, open index.html
     and make sure the API_URL in the script points to:
     http://localhost:3000

6. USAGE
   - First time: Enter a username
   - Click + icon to add post/story
   - View stories by clicking on story circles
   - Click trash icon to delete your posts
   - All posts/stories are automatically deleted after 24 hours

7. TROUBLESHOOTING
   - If MongoDB connection fails, make sure MongoDB is running
   - Check MongoDB URI in server.js (default: mongodb://localhost:27017/instagram_clone)
   - If port 3000 is busy, change PORT in server.js
   - Make sure CORS is enabled for cross-origin requests

8. SERVING FRONTEND WITH EXPRESS (RECOMMENDED)
   To serve the HTML file from Express, add this to server.js after the middleware:

   app.use(express.static('public'));

   Then place index.html in a 'public' folder and access at:
   http://localhost:3000

9. DATABASE COLLECTIONS
   The app creates:
   - namesdata: Stores usernames and session IDs
   - [username]: Individual collection for each user's posts/stories

10. FEATURES IMPLEMENTED
    ✓ Session-based user authentication
    ✓ Username registration with validation
    ✓ Post and story upload (image only)
    ✓ Real-time content display
    ✓ Story viewer with progress bar
    ✓ User post deletion
    ✓ Automatic 24-hour content cleanup
    ✓ Instagram-like design
    ✓ Responsive layout
