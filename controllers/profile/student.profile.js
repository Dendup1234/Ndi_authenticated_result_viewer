import Student from "../../models/student.js";


// Getting profile of the student
export const getProfile = async (req, res) => {
    try {
        const user_id = req.user.sub;
        //Hides password and return plain json format
        const student = await Student.findById(user_id).select("-password").lean();
        if (!student) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({
            profile: student
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: "Server error" });
    }
};