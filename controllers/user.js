const User = require("../model/user");
const { sendError, createRandomBytes } = require("../utils/helper");
const jwt = require("jsonwebtoken");
const {
  generateOtp,
  mailTransports,
  generateEmailTemplate,
  generatePasswordResetTemplate,
} = require("../utils/mail");
const verificationToken = require("../model/verificationToken");
const { isValidObjectId } = require("mongoose");
const ResetToken = require("../model/resetToken");

exports.createUser = async (req, res) => {
  const { username, email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) return sendError(res, "This email already exists");

  const newUser = new User({
    username,
    email,
    password,
  });

  const otp = generateOtp();
  const VerificationToken = new verificationToken({
    owner: newUser._id,
    token: otp,
  });

  await VerificationToken.save();
  await newUser.save();

  mailTransports().sendMail({
    from: "emailverification@atg.com",
    to: newUser.email,
    subject: "Verify your email account",
    html: generateEmailTemplate(otp),
  });

  res.json({
    success: true,
    message: "Your email is verified",
    id: newUser._id,
  });
};

exports.signIn = async (req, res) => {
  const { username, password } = req.body;
  if (!username.trim() || !password.trim())
    return sendError(res, "username/Password Missing");

  const user = await User.findOne({ username });
  if (!user) return sendError(res, "User not found");

  const isMatched = await user.comparePasswords(password);
  if (!isMatched) return sendError(res, "username/password does not match");

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({
    success: true,
    user: {
      username: user.username,
      email: user.email,
      id: user._id,
      token: token,
    },
  });
};

exports.verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp.trim())
    return sendError(res, "Invalid request, missing parameters!");

  if (!isValidObjectId(userId)) return sendError(res, "Invalid User ID");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "Sorry, User not found");

  if (user.verified) return sendError(res, "This account is already verified");

  const token = await verificationToken.findOne({ owner: user._id });
  if (!token) return sendError(res, "Sorry, User not found");

  const isMatched = await token.compareToken(otp);
  if (!isMatched) return sendError(res, "Please provide a valid token");

  user.verified = true;

  await verificationToken.findByIdAndDelete(token._id);
  await user.save();

  res.json({
    success: true,
    message: "Your email is verified",
    user: { username: user.username, email: user.email, id: user._id },
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, "Please provide a valid email");

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "User not found, Invalid request");

  const token = await ResetToken.findOne({ owner: user._id });
  if (token)
    return sendError(
      res,
      "You can only change password after one hour of changing your password"
    );

  const randomToken = await createRandomBytes();
  const resetToken = new ResetToken({ owner: user._id, token: randomToken });
  await resetToken.save();

  mailTransports().sendMail({
    from: "security@atg.com",
    to: user.email,
    subject: "Password Reset",
    html: generatePasswordResetTemplate(
      `http://localhost:3000/reset?token=${randomToken}&id=${user._id}`
    ),
  });

  res.json({ success: true, message: "Password reset link sent to you email" });
};

exports.resetPassword = async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return sendError(res, "User not found!");

  const isSamePassword = await user.comparePasswords(password);
  if (isSamePassword)
    return sendError(res, "New password must not be same as old password");

  if (password.trim().length < 8)
    return sendError(res, "Password must be longer than 8 characters");

  user.password = password.trim();
  await user.save();

  await ResetToken.findOneAndDelete({ owner: user._id });

  // send mail here

  res.json({ success: true, message: "Password Reset Successfully" });
};
