const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true,
    },
    eventDescription: {
        type: String,
        required: true
    },
    location: {
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        }
    },
    requiredSkills: {
        type: [String],
        required: true
    },
    urgency: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    },
    startDate:{
        type: Date,
        required: true
    },
    endDate:{
        type: Date,
        required: true,
        validate: {
            validator: function(v) {
                return v >= this.startDate
            },
            message: "End date must be after the start date."
        }
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }]
})

module.exports = mongoose.model("Event", eventSchema);