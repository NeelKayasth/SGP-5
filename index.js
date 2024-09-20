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

// Offering A Ride - Protected Route
// app.post('/offer-ride', isAuthenticated, (req, res) => {
//     const {
//         driver_name,
//         vehicle,
//         seat,
//         meet,
//         meet_location,
//         meet1,
//         meet_location1,
//         departure_date,
//         departure_time,
//         contact_number
//     } = req.body;

// const uid = req.session.userid;

//     if (meet === meet1) {
//         req.flash('error', 'Pickup and drop-off locations cannot be the same.');
//         return res.redirect('/offer-ride');
//     }

//     const locationMap = {
//         "Campus Back Gate": "Campus Back Gate(Beside Parking)",
//         "Campus Front Gate": "Campus Front Gate",
//         "Anand": "Anand",
//         "Nadiad": "Nadiad",
//         "Ahmedabad": "Ahmedabad",
//         "Vadodara": "Vadodara"
//     };

//     const vehicleMap = {
//         "4": "4 Wheeler",
//         "2": "2 Wheeler"
//     };

//     const meet_location_value = Array.isArray(meet_location) ? meet_location.find(loc => loc.trim() !== '') : meet_location;
//     const meet_location1_value = Array.isArray(meet_location1) ? meet_location1.find(loc => loc.trim() !== '') : meet_location1;

//     const meeting_location_name = locationMap[meet] || null;
//     const dropoff_location_name = locationMap[meet1] || null;
//     const vehicle_type_name = vehicleMap[vehicle] || null;

//     if (!driver_name || !vehicle_type_name || !seat || !meet || !meet1 || !departure_date || !departure_time || !meeting_location_name || !contact_number) {
//         return res.status(400).send('All fields are required.');
//     }

//     // Check if the user has already offered a ride for the same date (ignore time)
//     const checkSql = `
//         SELECT * FROM rides 
//         WHERE user_id = ? 
//         AND DATE(departure_date) = ?
//     `;

//     db.query(checkSql, [uid, departure_date], (err, results) => {
//         if (err) {
//             console.error('Database error:', err.message);
//             return res.status(500).send('An error occurred while checking for existing rides.');
//         }

//         if (results.length > 0) {
//             // console.log("User has already offered a ride on this date.");
//             // req.flash('error', 'You have already offered a ride for this date.');
            
//             res.json({ success: false, message: 'You have already offered a ride for this date.' });
//             return  res.redirect('/myrides');
//         }
//     });

//     const sql = `
//         INSERT INTO rides (
//             driver_name,
//             vehicle_type,
//             seats_available,
//             meeting_location,
//             meeting_location_specific,
//             dropoff_location,
//             dropoff_location_specific,
//             departure_date,
//             departure_time,
//             contact_number,
//             booked,
//             user_id 
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
//     `;

//     const values = [
//         driver_name,
//         vehicle_type_name,
//         seat,
//         meeting_location_name,
//         meet_location_value || '',
//         dropoff_location_name,
//         meet_location1_value || '',
//         departure_date,
//         departure_time,
//         contact_number,
//         0,
//         uid
//     ];

//     db.query(sql, values, (err, result) => {
//         if (err) {
//             console.error('Database error:', err.message);
//             return res.status(500).send('Failed to offer a ride.');
//         }

        
//         res.redirect('/myrides');
//     });
// });

// app.post('/offer-ride', isAuthenticated, (req, res) => {
//     const {
//         driver_name,
//         vehicle,
//         seat,
//         meet,
//         meet_location,
//         meet1,
//         meet_location1,
//         departure_date,
//         departure_time,
//         contact_number
//     } = req.body;

//     const uid = req.session.userid;

//     if (meet === meet1) {
//         req.flash('error', 'Pickup and drop-off locations cannot be the same.');
//         return res.json({ success: false, message: 'Pickup and drop-off locations cannot be the same.' });
//     }

//     const locationMap = {
//         "Campus Back Gate": "Campus Back Gate(Beside Parking)",
//         "Campus Front Gate": "Campus Front Gate",
//         "Anand": "Anand",
//         "Nadiad": "Nadiad",
//         "Ahmedabad": "Ahmedabad",
//         "Vadodara": "Vadodara"
//     };

//     const vehicleMap = {
//         "4": "4 Wheeler",
//         "2": "2 Wheeler"
//     };

//     const meet_location_value = Array.isArray(meet_location) ? meet_location.find(loc => loc.trim() !== '') : meet_location;
//     const meet_location1_value = Array.isArray(meet_location1) ? meet_location1.find(loc => loc.trim() !== '') : meet_location1;

//     const meeting_location_name = locationMap[meet] || null;
//     const dropoff_location_name = locationMap[meet1] || null;
//     const vehicle_type_name = vehicleMap[vehicle] || null;

//     if (!driver_name || !vehicle_type_name || !seat || !meet || !meet1 || !departure_date || !departure_time || !meeting_location_name || !contact_number) {
//         return res.status(400).json({ success: false, message: 'All fields are required.' });
//     }

//     // Check if the user has already offered a ride for the same date
//     const checkSql = `
//         SELECT * FROM rides 
//         WHERE user_id = ? 
//         AND DATE(departure_date) = ?
//     `;
//     // and depatur_time < current_time

//     db.query(checkSql, [uid, departure_date], (err, results) => {
//         if (err) {
//             console.error('Database error:', err.message);
//             return res.status(500).json({ success: false, message: 'An error occurred while checking for existing rides.' });
//         }

//         if (results.length > 0) {
//             return res.json({ success: false, message: 'You have already offered a ride for this date.' });
//         }

//         // Proceed to insert the ride
//         const sql = `
//             INSERT INTO rides (
//                 driver_name,
//                 vehicle_type,
//                 seats_available,
//                 meeting_location,
//                 meeting_location_specific,
//                 dropoff_location,
//                 dropoff_location_specific,
//                 departure_date,
//                 departure_time,
//                 contact_number,
//                 booked,
//                 user_id 
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//         const values = [
//             driver_name,
//             vehicle_type_name,
//             seat,
//             meeting_location_name,
//             meet_location_value || '',
//             dropoff_location_name,
//             meet_location1_value || '',
//             departure_date,
//             departure_time,
//             contact_number,
//             0,
//             uid
//         ];

//         db.query(sql, values, (err, result) => {
//             if (err) {
//                 console.error('Database error:', err.message);
//                 return res.status(500).json({ success: false, message: 'Failed to offer a ride.' });
//             }

//             return res.json({ success: true, message: 'Ride offered successfully!', redirectUrl: '/myrides' });
//         });
//     });
// });

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

// Booking a ride - Protected Route
app.post('/book', isAuthenticated, (req, res) => {
    const rideId = req.body.rideId;
    const email = req.session.email;
    console.log("Hi");

    const sqlQuery = 'UPDATE rides SET booked = 1 WHERE id = ?';

    db.query(sqlQuery, [rideId], (err, results) => {
        if (err) {
            console.error('Error updating ride:', err);
            return res.status(500).json({ success: false, message: 'Failed to book the ride.' });
        }

        const mailOptions = {
            from: 'hirenmehtadhruv@gmail.com', // sender address
            to: email, // receiver's email (user who booked the ride)
            subject: 'Ride Booking Confirmation',
            text: 'Thank you for booking your ride with us. Your ride is confirmed!'
          };
        
          // Send the email
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
              res.status(500).send('Error sending confirmation email');
            } else {
              console.log('Email sent: ' + info.response);
              res.status(200).send('Ride booked successfully, confirmation email sent');
            }
          });

        res.json({ success: true });
    });


});

// Cancel a booked ride
app.post('/cancel-ride', async (req, res) => {
    const { rideId } = req.body;

    try {
        // Update the ride's booked status to 0 (unbooked) based on the rideId
        await db.promise().query('UPDATE rides SET booked = 0, user_id = NULL WHERE id = ?', [rideId]);

        // Send success response
        res.json({ message: 'Ride canceled successfully!', status: 'success' });
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
        const user_id = insertResult.insertId; // This gets the user ID

        // Prepare the email with the verification link
        const mailOptions = {
            from: 'rideshare577@gmail.com',
            to: email,
            subject: 'For Verification at RideShare.',
            html: '<p>Hi  <strong>' + username + '</strong></p><br/>\n' +
                '<p>Please click on the following link to verify your account.</p>\n' +
                '<a href="http://localhost:3000/verify?id=' + user_id + '">Verify Account</a>',
        };

        // Send the email
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log('Error sending verification email:', error);
            } else {
                console.log('Email sent: ', info.response);
            }
        });

        req.flash('success', 'Registration successful! Please check your email to verify your account.');
        res.redirect('/login');
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error', 'An error occurred during registration. Please try again.');
        res.redirect('/register');
    }
});




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
  