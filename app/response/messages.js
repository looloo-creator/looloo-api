const message = {
    "R200": { type: false, message: "Process Completed" },

    /* Success */
    "R201": { type: "success", message: "Thanks for registering, verify your mail address and continue to login" },
    "R206": { type: "success", message: "username/email has already in use, You can login" },
    "R207": { type: "success", message: "Please verify your mail address and continue to login" },

    "R208": { type: "success", message: "Tour Added Successfully, You can add the Members" },
    "R209": { type: "success", message: "Tour Updated Successfully" },
    "R210": { type: "success", message: "Tour Deleted Successfully" },

    "R211": { type: "success", message: "Member Added Successfully" },
    "R212": { type: "success", message: "Member Updated Successfully" },
    "R213": { type: "success", message: "Member Deleted Successfully" },

    "R214": { type: "success", message: "Added Successfully" },
    "R215": { type: "success", message: "Data Updated Successfully" },
    "R216": { type: "success", message: "Deleted Successfully" },

    /* Info */

    "R202": { type: "info", message: "Mail Id Not registered" },
    "R203": { type: "info", message: "Mail Id Not verified" },
    "R204": { type: "info", message: "Inactive account contact administrator" },
    "R205": { type: "info", message: "Invalid Mail Id or Password" },

    /* Info */
    "R400": { type: "error", message: "Bad Request" },
    "R401": { type: "error", message: "Authentication Failed" }, // Frontend will Redirect to Login Screen
    "R404": { type: "error", message: "Something Went Wrong, Please Try after sometime" },

    /* Warning */

}

const getMessage = (code) => {
    return message[code] ? message[code].message : "";
}
const getType = (code) => {
    return message[code] ? message[code].type : "";
}

module.exports = { getMessage, getType };