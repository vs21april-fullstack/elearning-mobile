import bcrypt from 'bcrypt';
import User from '../user/user.model.js';
import Parents from '../parents/parents.model.js';
import UserCourse from '../user/userCourse.model.js';
import Course from '../course/course.model.js';
import { success } from '../../utils/response.js';
import { NotFoundError, AuthenticationError } from '../../utils/customErrors.js';
import { BCRYPT_ROUNDS } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';

/**
 * Get current user profile
 */
export const getProfile = async (req, reply) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .select('-password')
            .populate('parents');

        if (!user) {
            throw new NotFoundError('User not found');
        }

        const data = user.toObject();

        if (user.role === 'student') {
            data.studentCourses = await UserCourse.find({
                user: userId,
                status: { $ne: 'dropped' }
            })
                .populate('course')
                .sort('-enrolledAt');
        }

        if (user.role === 'teacher') {
            data.teacherCourses = await Course.find({
                $or: [
                    { teacher: userId },
                    { teachers: userId }
                ],
                isActive: true
            }).sort('title');
        }

        logger.info(`Profile retrieved for user: ${userId}`);

        return success(reply, data, 'Profile retrieved successfully');
    } catch (err) {
        throw err;
    }
};

/**
 * Update current user profile
 */
export const updateProfile = async (req, reply) => {
    try {
        const userId = req.user.id;
        const { name, email, phone, parents, teacherProfile } = req.body;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Check for duplicate email or phone (excluding current user)
        if (email || phone) {
            const duplicate = await User.findOne({
                _id: { $ne: userId },
                $or: [
                    ...(email ? [{ email }] : []),
                    ...(phone ? [{ phone }] : [])
                ]
            });

            if (duplicate) {
                const field = duplicate.email === email ? 'Email' : 'Phone';
                throw new Error(`${field} already exists`);
            }
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;

        if (user.role === 'teacher' && teacherProfile !== undefined) {
            user.teacherProfile = {
                qualifications: teacherProfile?.qualifications || [],
                experiences: teacherProfile?.experiences || []
            };
        }

        if (user.role === 'student' && parents !== undefined) {
            const existingParents = await Parents.findByStudent(userId);

            if (existingParents) {
                await Parents.findOneAndUpdate(
                    { student: userId },
                    parents,
                    { new: true, runValidators: true }
                );
            } else {
                const parentsDoc = await Parents.createForStudent(userId, parents);
                user.parents = parentsDoc._id;
            }
        }

        await user.save();

        logger.info(`Profile updated for user: ${userId}`);

        // Return updated user without password
        const updatedUser = await User.findById(userId)
            .select('-password')
            .populate('parents');

        const responseData = updatedUser.toObject();

        if (updatedUser.role === 'student') {
            responseData.studentCourses = await UserCourse.find({
                user: userId,
                status: { $ne: 'dropped' }
            })
                .populate('course')
                .sort('-enrolledAt');
        }

        if (updatedUser.role === 'teacher') {
            responseData.teacherCourses = await Course.find({
                $or: [
                    { teacher: userId },
                    { teachers: userId }
                ],
                isActive: true
            }).sort('title');
        }

        return success(reply, responseData, 'Profile updated successfully');
    } catch (err) {
        throw err;
    }
};

/**
 * Change user password
 */
export const changePassword = async (req, reply) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(userId).select('+password');

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            throw new AuthenticationError('Current password is incorrect');
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new Error('New password must be different from current password');
        }

        // Hash and update password
        user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await user.save();

        logger.info(`Password changed for user: ${userId}`);

        return success(reply, null, 'Password changed successfully');
    } catch (err) {
        throw err;
    }
};
