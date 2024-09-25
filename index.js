const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');


const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware setup
app.use(session({
    secret: 'your-secret-key', // Replace with a secure key
    resave: false,
    saveUninitialized: true
}));

// Flash message middleware
app.use(flash());

// MySQL connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Neel12345',
    database: 'ride_sharing'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userid) {
        return next();
    }
    req.flash('error', 'Please log in to access this page.');
    res.redirect('/login');
}

// Home route with flash message handling
app.get('/', (req, res) => {
    const username = req.session.username;
    const messages = req.flash('success'); // Retrieve flash messages
    res.render('index', { username,messages });
});

// Route to render the offer ride form - Protected Route
app.get('/offer-ride', isAuthenticated, (req, res) => {
    const username = req.session.username;
    res.render('offer-ride',{username});
});

// Profile Page - Protected Route
app.get('/profile', isAuthenticated, (req, res) => {
    const username = req.session.username;
    const email = req.session.email;
    const contact = req.session.phone_number;
    const gender = req.session.gender;
    console.log(gender);
    console.log(contact);
    res.render('profile',{username,email,contact,gender});
});

// Login Page 
app.get('/login', (req, res) => {
    res.render('login');
});


app.post('/offer-ride', isAuthenticated, (req, res) => {
    const {
        driver_name,
        vehicle,
        seat,
        meet,
        meet_location,
        meet1,
        meet_location1,
        departure_date,
        departure_time,
        contact_number
    } = req.body;

    const uid = req.session.userid;

    if (meet === meet1) {
        return res.json({ success: false, message: 'Pickup and drop-off locations cannot be the same.' });
    }

    const locationMap = {
        "Campus Back Gate": "Campus Back Gate(Beside Parking)",
        "Campus Front Gate": "Campus Front Gate",
        "Anand": "Anand",
        "Nadiad": "Nadiad",
        "Ahmedabad": "Ahmedabad",
        "Vadodara": "Vadodara"
    };

    const vehicleMap = {
        "4": "4 Wheeler",
        "2": "2 Wheeler"
    };

    const meet_location_value = Array.isArray(meet_location) ? meet_location.find(loc => loc.trim() !== '') : meet_location;
    const meet_location1_value = Array.isArray(meet_location1) ? meet_location1.find(loc => loc.trim() !== '') : meet_location1;

    const meeting_location_name = locationMap[meet] || null;
    const dropoff_location_name = locationMap[meet1] || null;
    const vehicle_type_name = vehicleMap[vehicle] || null;

    if (!driver_name || !vehicle_type_name || !seat || !meet || !meet1 || !departure_date || !departure_time || !meeting_location_name || !contact_number) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Query to check the last ride offered by the user on the same date
    const checkSql = `
        SELECT * FROM rides 
        WHERE user_id = ? 
        AND DATE(departure_date) = ?
        ORDER BY departure_time DESC
        LIMIT 1
    `;

    db.query(checkSql, [uid, departure_date], (err, results) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ success: false, message: 'An error occurred while checking for existing rides.' });
        }

        if (results.length > 0) {
            const lastOfferedRide = results[0];
            const lastOfferedTime = lastOfferedRide.departure_time;  // Get the previously offered ride's departure time
            
            // Get the current server time
            const currentTime = new Date();
            const currentTimeHoursMinutes = currentTime.toTimeString().slice(0, 5);  // Get current time in HH:MM format
            
            // Check if the current time is before or equal to the last offered ride time
            if (currentTimeHoursMinutes <= lastOfferedTime) {
                return res.json({ success: false, message: `You cannot offer a new ride before ${lastOfferedTime}. Please wait until the time has passed.` });
            }
        }

        // If no rides or time has passed, proceed to insert the new ride
        const sql = `
            INSERT INTO rides (
                driver_name,
                vehicle_type,
                seats_available,
                meeting_location,
                meeting_location_specific,
                dropoff_location,
                dropoff_location_specific,
                departure_date,
                departure_time,
                contact_number,
                booked,
                user_id 
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            driver_name,
            vehicle_type_name,
            seat,
            meeting_location_name,
            meet_location_value || '',
            dropoff_location_name,
            meet_location1_value || '',
            departure_date,
            departure_time,
            contact_number,
            0,
            uid
        ];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ success: false, message: 'Failed to offer a ride.' });
            }

            return res.json({ success: true, message: 'Ride offered successfully!', redirectUrl: '/myrides' });
        });
    });
});


// Find ride page
app.get('/find-ride',isAuthenticated, (req, res) => {
    const username = req.session.username
    const search = 'false';
    const meeting = null;
    const drop = null;
    const date = null;
    res.render('find-ride', { username ,meeting,drop,date,search , rides: [] });
});

function normalizeLocation(location) {
    return location.replace(/\s*\(.*?\)\s*/g, '').trim();
}

// Searching the ride
app.post('/find-ride', isAuthenticated,(req, res) => {
    const username = req.session.username

    const meeting = req.body.meet;
    const drop = req.body.meet1;
    const date = req.body.departure_date;
    console.log(meeting);
    const { meet, meet1, departure_date } = req.body;

    let sqlQuery = 'SELECT * FROM rides WHERE booked = 0';
    const queryParams = [];

    if (meet) {
        const normalizedMeet = normalizeLocation(meet);
        sqlQuery += ' AND REPLACE(meeting_location, "(Beside Parking)", "") = ?';
        queryParams.push(normalizedMeet);
    }

    if (meet1) {
        const normalizedMeet1 = normalizeLocation(meet1);
        sqlQuery += ' AND REPLACE(dropoff_location, "(Beside Parking)", "") = ?';
        queryParams.push(normalizedMeet1);
    }

    if (departure_date) {
        sqlQuery += ' AND DATE(departure_date) = ?';
        queryParams.push(departure_date);
    }

    db.query(sqlQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('An error occurred while fetching rides');
        }
        const search = 'true';
        res.render('find-ride', { username,meeting,drop,date,search,rides: results });
    });
});



app.post('/book', isAuthenticated, (req, res) => {
    const rideId = req.body.rideId;
    const email = req.session.email;

    // Update the ride as booked
    const updateQuery = 'UPDATE rides SET booked = 1 WHERE id = ?';

    db.query(updateQuery, [rideId], (err, updateResults) => {
        if (err) {
            console.error('Error updating ride:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to book the ride. Please try again later.' 
            });
        }

        // Ensure the ride was successfully updated
        if (updateResults.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Ride not found. Unable to book.' 
            });
        }

        // Retrieve the ride details after booking
        const selectQuery = 'SELECT * FROM rides WHERE id = ?';
        
        db.query(selectQuery, [rideId], (err, rideResults) => {
            if (err) {
                console.error('Error fetching ride details:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to fetch ride details.' 
                });
            }

            // Ensure ride details are found
            if (rideResults.length > 0) {
                const ride = rideResults[0];  // Ride details (name, date, time, etc.)

                // Prepare the HTML email content
                const mailOptions = {
                    from: 'rideshare577@gmail.com',  // sender's email address
                    to: email,  // receiver's email (user who booked the ride)
                    subject: 'Ride Booking Confirmation',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h2 style="text-align: center; color: #4CAF50;">Ride Booking Confirmation</h2>
                            <p>Dear Customer,</p>
                            <p>Thank you for booking your ride with us! Your ride is confirmed with the following details:</p>

                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <tr>
                                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Rider Name</th>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${ride.driver_name}</td>
                                </tr>
                                <tr>
                                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Rider Contact</th>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">+91 ${ride.contact_number}</td>
                                </tr>
                                <tr>
                                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Ride Date</th>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${ride.departure_date}</td>
                                </tr>
                                <tr>
                                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Ride Time</th>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${ride.departure_time}</td>
                                </tr>
                                <tr>
                                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Pickup Location</th>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${ride.meeting_location} ${ride.meeting_location_specific}</td>
                                </tr>
                                <tr>
                                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Dropoff Location</th>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${ride.dropoff_location}</td>
                                </tr>
                            </table>

                            <p style="margin-top: 20px;">We hope you enjoy your ride!</p>

                            <p style="font-size: 14px; color: #777;">If you have any questions or need assistance, feel free to contact us at support@rideshare577.com.</p>
                            <p style="font-size: 14px; color: #777;">Regards,<br>RideShare Team</p>

                            <footer style="text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #aaa;">
                                &copy; 2024 RideShare. All Rights Reserved.
                            </footer>
                        </div>
                    `
                };

                // Send the confirmation email
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email:', error);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Error sending confirmation email.' 
                        });
                    }

                    console.log('Email sent: ' + info.response);
                    return res.status(200).json({ 
                        success: true, 
                        message: 'Ride booked successfully, confirmation email sent.' 
                    });
                });
            } else {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Ride not found.' 
                });
            }
        });
    });
});



app.post('/cancel-ride', async (req, res) => {
    const { rideId } = req.body;
    const email = req.session.email; // Assuming the email is stored in the session
    const userId = req.session.userId; // Assuming the user ID is stored in the session

    try {
        // Update the ride's booked status to 0 (unbooked) based on the rideId
        await db.promise().query('UPDATE rides SET booked = 0, user_id = NULL WHERE id = ?', [rideId]);

        // Retrieve ride details for the email
        const [rideDetails] = await db.promise().query('SELECT * FROM rides WHERE id = ?', [rideId]);

        if (rideDetails.length > 0) {
            const ride = rideDetails[0]; // Ride details

            // Prepare email with cancellation details
            const mailOptions = {
                from: 'rideshare577@gmail.com',
                to: email, // User's email who canceled the ride
                subject: 'Ride Cancellation Confirmation',
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #E74C3C;">Ride Cancellation Notice</h2>
                        <p>Dear <strong>${req.session.username}</strong>,</p>
                        <p>Your ride has been successfully canceled. Here are the details:</p>
                        <ul>
                            <li><strong>Ride ID:</strong> ${rideId}</li>
                            <li><strong>Driver Name:</strong> ${ride.driver_name}</li>
                            <li><strong>Pickup Location:</strong> ${ride.meeting_location} ${ride.meeting_location_specific}</li>
                            <li><strong>Dropoff Location:</strong> ${ride.dropoff_location}</li>
                            <li><strong>Date:</strong> ${ride.departure_date}</li>
                            <li><strong>Time:</strong> ${ride.departure_time}</li>
                        </ul>
                        <p>If you have any questions, feel free to <a href="mailto:rideshare577@gmail.com">contact us</a>.</p>
                        <footer style="font-size: 12px; color: #777; margin-top: 20px;">
                            &copy; 2024 RideShare. All rights reserved.
                        </footer>
                    </div>
                `
            };

            // Send the cancellation email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error sending cancellation email:', error);
                    return res.status(500).json({ message: 'Ride canceled, but email could not be sent.', status: 'error' });
                } else {
                    console.log('Cancellation email sent: ', info.response);
                    return res.status(200).json({ message: 'Ride canceled successfully, email sent!', status: 'success' });
                }
            });
        } else {
            return res.status(404).json({ message: 'Ride not found.', status: 'error' });
        }
    } catch (error) {
        console.error('Error canceling ride:', error);
        // Send error response
        res.status(500).json({ message: 'Failed to cancel the ride. Please try again.', status: 'error' });
    }
});


// Contact pages
app.get('/contact', (req, res) => {
    res.render('contact');
});

// Route to get all rides and render them using EJS
app.get('/myrides', (req, res) => {
    const id = req.session.userid;
    const sql = 'SELECT * FROM rides where user_id = ?';
    db.query(sql,[id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        console.log(sql);
        console.log(results);
        res.render('rides', { rides: results });
    });
});

// Registration
// Registration
app.post('/register', async (req, res) => {
    const { username, phone_number, email, password, gender } = req.body;

    try {
        // Check if the email is already registered
        const [existingUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUser.length > 0) {
            req.flash('error', 'Email is already registered.');
            return res.redirect('/register');
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const [insertResult] = await db.promise().query(
            'INSERT INTO users (username, email, password, phone_number, gender) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, phone_number, gender]
        );

        // Get the user_id of the newly registered user
        const user_id = insertResult.insertId; // Fetches the new user's ID

        // Prepare the email with the verification link
        const verificationLink = `http://localhost:3000/verify?id=${user_id}`;
        const mailOptions = {
            from: 'rideshare577@gmail.com',
            to: email,
            subject: 'RideShare Account Verification',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #4CAF50;">Welcome to RideShare, ${username}!</h2>
                    <p>Thank you for registering with us. To activate your account, please verify your email by clicking the link below:</p>
                    <p style="margin: 20px 0;">
                        <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify My Account</a>
                    </p>
                    <p>If you did not request this, please ignore this email.</p>
                    <footer style="font-size: 12px; color: #777; margin-top: 20px;">
                        &copy; 2024 RideShare. All rights reserved.
                    </footer>
                </div>`
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending verification email:', error);
                req.flash('error', 'Could not send verification email. Please try again.');
                return res.redirect('/register');
            } else {
                console.log('Verification email sent: ', info.response);
                req.flash('success', 'Registration successful! Please check your email to verify your account.');
                return res.redirect('/login');
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error', 'An error occurred during registration. Please try again.');
        res.redirect('/register');
    }
});


// Load environment variables from .env file
require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Initialize session handling with environment variable for session secret
app.use(session({
    secret: process.env.SESSION_SECRET,  // Use secret from .env file
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Google OAuth strategy using environment variables
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;

        // Check if the user already exists in the database
        const [existingUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUser.length > 0) {
            return done(null, existingUser[0]); // User already exists, log them in
        }

        // If the user doesn't exist, create a new user
        const username = profile.displayName;
        const hashedPassword = await bcrypt.hash('random-password', 10);  // Random password for OAuth users
        const gender = 'N/A';  // Set a default gender

        const [insertResult] = await db.promise().query(
            'INSERT INTO users (username, email, password, gender, is_verfied) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, gender, true]  // Set `is_verified` to true for Google OAuth
        );

        const newUser = {
            id: insertResult.insertId,
            username,
            email,
            gender
        };

        return done(null, newUser);
    } catch (error) {
        console.error('Error with Google Authentication:', error);
        return done(error, null);
    }
}));

// Serialize user to store in session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const [user] = await db.promise().query('SELECT * FROM users WHERE id = ?', [id]);
        done(null, user[0]);
    } catch (error) {
        done(error, null);
    }
});

// Route to initiate Google OAuth login
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback route
app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/',  // Redirect to home page on success
    failureRedirect: '/login',  // Redirect to login on failure
    failureFlash: true
}));







// Login
app.post("/loginadd", (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error(err);
            req.flash('error', 'An error occurred during login. Please try again.');
            return res.redirect('/login');
        }

        if (results.length === 0) {
            req.flash('error', 'Email is not registered.');
            return res.redirect('/login');
        }

        const user = results[0];
        const hashedPassword = user.password;

        bcrypt.compare(password, hashedPassword, (err, isMatch) => {
            if (err) {
                console.error(err);
                req.flash('error', 'An error occurred during login. Please try again.');
                return res.redirect('/login');
            }

            if (!isMatch) {
                req.flash('error', 'Incorrect password.');
                return res.redirect('/login');
            }

            req.session.userid = user.id;
            req.session.username = user.username;
            req.session.email = user.email;
            req.session.phone_number = user.phone_number;
            req.session.gender = user.gender;

            req.flash('success', 'Login successful');
            return res.redirect('/');
        });
    });
});

app.get("/logout" ,(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            console.error(err);
            return res.redirect('/');
            }
            return res.redirect('/');
            });

});

// Verification route
app.get('/verify', async (req, res) => {
    const userId = req.query.id;

    if (!userId) {
        return res.status(400).send('Verification link is invalid or missing.');
    }

    try {
        console.log(userId);
        // Check if the user exists
        const [results] = await db.promise().query('SELECT * FROM users WHERE id = ?', [userId]);

        if (results.length === 0) {
            return res.status(404).send('User not found.');
        }

        const user = results[0];

        // Check if the user is already verified
        if (user.is_verified) {
            return res.status(400).send('Account is already verified.');
        }

        // Update the user to mark them as verified
        await db.promise().query('UPDATE users SET is_verfied = 1 WHERE id = ?', [userId]);

        req.flash('success', 'Account successfully verified. Please log in.');
        res.redirect('/login');
    } catch (error) {
        console.error('Error verifying account:', error);
        res.status(500).send('An error occurred during verification. Please try again.');
    }
});


// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});


const transporter = nodemailer.createTransport({
    service: 'Gmail', // or another email service
    auth: {
      user: 'rideshare577@gmail.com', // replace with your email
      pass: 'rqvbraleuiykqwcc' // replace with your email password
    }
  });
  