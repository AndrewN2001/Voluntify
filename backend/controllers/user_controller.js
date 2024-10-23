const userModel = require("../models/user")
const bcrypt = require('bcrypt')
const { events, volunteers } = require('../global_arrays/data');

const handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body.credentials.accountInfo;
        const searchUser = await userModel.findOne({ 'emailAddress': email })
        if (searchUser) {
            const valid = await bcrypt.compare(password, searchUser.password);
            if (valid){
                // res.json({
                //     message: "login successful!",
                //     username: searchUser.username,
                // })
                res.json(searchUser);
            } else {
                res.status(400).json({message: "Invalid password."})
            }
        } else {
            res.status(401).json({ message: "User not found." })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error",
        })
    }
}

const handleRegister = async (req, res) => {
    try {
        const newUserData = req.body.accountForm;
        const existingUser = await userModel.findOne({ 'accountInfo.emailAddress': newUserData.emailAddress })
        const hashedPassword = await bcrypt.hash(newUserData.password, 10);

        const newUser = new userModel({
            name: {
                firstName: newUserData.name.firstName,
                lastName: newUserData.name.lastName
            },
            location: {
                city: newUserData.location.city,
                state: newUserData.location.state
            },
            phoneNumber: newUserData.phoneNumber,
            emailAddress: newUserData.emailAddress,
            password: hashedPassword
        });
        const saveUser = await newUser.save();
        res.json(newUser);
    } catch (error) {
        if (error.code === 11000){
            return res.status(409).json({message: "Account already exists!"});
        }
        console.error("Error saving user:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

const getUserProfile = async (req, res) => {
    try {
        const userID = req.params.userID; // userId for when needed by DB later
        const userProfile = await userModel.findById(userID);
        if (!userProfile){
            return res.status(404).json({
                message: "User not found"
            });
        }
        // Respond with the hardcoded user profile
        res.json(userProfile);        
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server Error" });
    }
}

const getNotifications = async (req, res) => {
    try{
        const {userID} = req.params;
        const user = await userModel.findById(userID, 'notifications')
        if (!user){
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json(user.notifications);
    res.json
    } catch (error) {
        console.error("Error getting user profile:", error);
        res.status(500).json({ message: "Server Error" });
    }
    
}

const handleNotifications = async (req, res) => { // edits notification settings for user
    try {
        const { userID } = req.params; // email will need to be passed through the route
        const { newEventAssignments, newEventUpdates, newEventReminders } = req.body.notifications;

        const newNotifications = {
            newEventAssignments: newEventAssignments,
            newEventUpdates: newEventUpdates,
            newEventReminders: newEventReminders
        }
        
        const updatedUser = await userModel.findByIdAndUpdate(
            userID,
            {$set: {["notifications"]: newNotifications}},
            {new: true} //by default, findByIdAndUpdate returns the document before it's updated. This ensures that mongoose returns the document after it's updated
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser.notifications);
    } catch (error) {
        console.error("Something went wrong", error);
        res.status(500).json({ message: "Something went wrong" });
    }
}

const addSkill = async (req, res) => {
    const { userID } = req.params;
    const { newSkill } = req.body;
    // console.log("Skill to add:", newSkill)
    // console.log("ID to add the skill to:", userID);
    try{
        const user = await userModel.findById(userID);
        if (!user){
            return res.status(404).json({message: "User not found."})
        }
        if (!user.skills.includes(newSkill)){
            user.skills.push(newSkill);
        }
        await user.save();
        res.status(200).json(user.skills);
    } catch (error) {
        console.error("Something went wrong", error);
        res.status(500).json({ message: "Something went wrong" });
    }
}

const removeSkill = async (req, res) => {
    try{
        const { userID, skill } = req.params;
        // console.log("Skill to remove:", skill);
        const user = await userModel.findByIdAndUpdate(
            userID,
            { $pull: { skills: skill } },
            { new: true } 
        );
        if (!user) {
            return res.status(404).json({message: "User not found"})
        }
        res.json({message: "Skill removed", user});
    } catch (error) {
        console.error("Something went wrong", error);
        res.status(500).json({ message: "Something went wrong" });
    }
}

// const getVolunteerHistory = async (req, res) => { // gets 
//     try {
//         // For now, use hardcoded events (replace with MongoDB query later)
//         const userId = req.params.userId;

//         // Respond with the hardcoded volunteer history
//         res.json(events);
//     } catch (error) {
//         console.error("Error fetching volunteer history:", error);
//         res.status(500).json({ message: "Server Error" });
//     }
// }
const getVolunteerHistory = async (req, res) => {
    try {
        const userID = req.params.userID;
        // Find the user by ID and populate the attendedEvents array
        const user = await userModel.findById(userID).populate("attendedEvents");
        if (!user) {
            return res.status(404).json({ 
                message: "User not found" 
            });
        }
        res.json(user.attendedEvents);
    } catch (error) {
        console.error("Error fetching volunteer history:", error);
        res.status(500).json({ message: "Server Error" });
    }
}

const handleMatching = async (req, res) => {
    try {
        let matches = [];

        const getDayOfWeek = (dateString) => {
            const date = new Date(dateString);
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            return days[date.getDay()];
        };
        volunteers.forEach(volunteer => {
            if (volunteer.role === "Volunteer") {
                let volunteerMatches = {
                    volunteerName: volunteer.name,
                    matchedEvents: []
                };
                events.forEach(event => {
                    const eventDay = getDayOfWeek(event.eventDate);
                    if (volunteer.location.city === event.location.city &&
                        volunteer.availability[eventDay] &&
                        volunteer.availability[eventDay].start <= event.eventTime &&
                        volunteer.availability[eventDay].end > event.eventTime) {

                        const hasSkills = event.requiredSkills.every(skill =>
                            volunteer.skills.includes(skill)
                        );

                        if (hasSkills) {
                            volunteerMatches.matchedEvents.push(event.eventName);
                        }
                    }
                });
                matches.push(volunteerMatches);
            }
        });

        res.json(matches);

    } catch (error) {
        console.error("Error fetching volunteer matching:", error);
        res.status(500).json({ message: "Server Error" });
    }
}


const getData = async (req, res) => { // gets all available events and volunteers
    try {
        const userId = req.params.userId;
        res.json({ events, volunteers });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Server Error" });
    }
}


const EventSignUp = async (req, res) => { // called when user signs up for specific event and adds it to their appliedEvents field
    try{
        const userId = req.params.userId;
        res.json(req.body);
    } catch (error){
        console.error("Error fetching data:", error);
        res.status(500).json({
            message: "Server Error",
        })
    }
}

const getEvents = async(req, res) => { // would get every event that the user signed up for
    try{
        const userId = req.params.userId;
        res.json(volunteers[0].appliedEvents);
    } catch (error){
        console.error("Error fetching data:", error);
        res.status(500).json({
            message: "Server Error",
        })
    }
}

const editUserInfo = async (req, res) => {
    try{
        const { userID } = req.params;
        const { newValues } = req.body;
        // console.log(userID, newValues);
        // res.json("Received");
        const updatedUser = await userModel.findByIdAndUpdate(
            userID,
            {$set: newValues},
            {new: true, runValidators: true}
        );

        if (!updatedUser) {
            return res.status(404).json({message: "User not found."});
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({
            message: "Server Error"
        })
    }
}

const editAvailability = async (req, res) => {
    try{
        const { userID } = req.params;
        const { key, start, end } = req.body.dayData;
        const newAvailability = {
            start: start,
            end: end
        }
        const updatedUser = await userModel.findByIdAndUpdate(
            userID,
            {$set: {[`availability.${key}`]: newAvailability}},
            {new: true}
        )

        if (!updatedUser){
            return res.status(404).json({message: "User not found."});
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error fetching data', error);
        res.status(500).json({
            message: "Server error"
        })
    }
}

module.exports = {
    handleLogin,
    handleRegister,
    getUserProfile,
    getNotifications,
    handleNotifications,
    getVolunteerHistory,
    handleMatching,
    getData,
    EventSignUp,
    getEvents,
    addSkill,
    removeSkill,
    editUserInfo,
    editAvailability
}