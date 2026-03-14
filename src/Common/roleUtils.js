export const normalizeRoles = (rawRoles) => {
  const collected = [];
  const collect = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === "string") {
      value
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean)
        .forEach((role) => collected.push(role));
      return;
    }
    if (typeof value === "object") {
      const roleName =
        value.UserRoleName ||
        value.RoleName ||
        value.Name ||
        value.role ||
        value.userRole;
      if (roleName) {
        collect(roleName);
        return;
      }
      const roleId = value.UserRoleId || value.RoleId;
      if (Number(roleId) === 10) {
        collected.push("HR");
      }
    }
  };

  collect(rawRoles);
  return Array.from(new Set(collected));
};

export const hasRole = (rawRoles, roleName) => {
  const roles = normalizeRoles(rawRoles);
  return roles.some(
    (role) => role.toLowerCase() === roleName.toLowerCase()
  );
};

export const hasAnyRole = (rawRoles, roleNames) =>
  roleNames.some((role) => hasRole(rawRoles, role));
