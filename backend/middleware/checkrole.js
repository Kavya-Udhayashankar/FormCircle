const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    // Normalize requiredRoles to an array
    const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden - Role not allowed" });
    }

    next();
  };
};

module.exports = checkRole;
