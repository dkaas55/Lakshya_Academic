const bcrypt = require("bcryptjs");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const generateToken = require("../utils/generateToken");

const SALT_ROUNDS = 12;
const VALID_ROLES = ["admin", "teacher", "student"];

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  role: user.role,
});

const register = async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    if (!name?.trim() || !username?.trim() || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, username, password, and role are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin, teacher, or student",
      });
    }

    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      passwordHash,
      role,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: formatUser(user),
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this username already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

const LOGIN_ROLES = ["admin", "teacher", "student"];

const login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username?.trim() || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, password, and role are required",
      });
    }

    const normalizedRole = String(role).trim().toLowerCase();

    if (!LOGIN_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin, teacher, or student",
      });
    }

    const user = await User.findOne({
      username: username.trim().toLowerCase(),
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (user.role !== normalizedRole) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Role mismatch.",
      });
    }

    // ── Student account status guard ──────────────────────────────────────────
    if (normalizedRole === "student") {
      const profile = await StudentProfile.findOne({ user: user._id }).lean();
      if (profile) {
        if (profile.status === "removed") {
          return res.status(403).json({
            success: false,
            message: "Your account has been removed. Please contact the institute.",
          });
        }
        if (profile.status === "paused") {
          return res.status(403).json({
            success: false,
            message: "Your account is temporarily paused. Please contact the institute.",
          });
        }
      }
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: formatUser(user),
        token: generateToken(user._id),
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: formatUser(req.user),
    },
  });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Incorrect current password",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

module.exports = { register, login, getMe, changePassword };
