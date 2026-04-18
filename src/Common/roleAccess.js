import { hasAnyRole, hasRole } from "./roleUtils";

// Central place for role names and access rules.
// Update role strings and groups here when roles change.
export const ROLES = Object.freeze({
  ADMIN: "Admin",
  HR: "HR",
  MANAGER: "Manager",
  PROPERTY_MANAGER: "Property Manager",
  PROPERTY_ADMIN: "Property Admin",
  INVENTORY_MANAGER: "Inventory Manager",
  FACILITY_MANAGER: "Facility Manager",
});

// Some backend endpoints expect a *single* "identity role" value.
// When the user has multiple roles, we choose the most privileged / relevant
// role so access checks remain consistent.
const getEmployeeAccessIdentityRole = (roles) => {
  if (hasRole(roles, ROLES.ADMIN)) return ROLES.ADMIN;
  if (hasRole(roles, ROLES.PROPERTY_ADMIN)) return ROLES.PROPERTY_ADMIN;
  if (hasRole(roles, ROLES.PROPERTY_MANAGER)) return ROLES.PROPERTY_MANAGER;
  // Two manager types supported: core Manager and Property Manager (above).
  if (hasRole(roles, ROLES.MANAGER)) return ROLES.MANAGER;
  if (hasRole(roles, ROLES.HR)) return ROLES.HR;
  if (hasRole(roles, ROLES.INVENTORY_MANAGER)) return ROLES.INVENTORY_MANAGER;
  if (hasRole(roles, ROLES.FACILITY_MANAGER)) return ROLES.FACILITY_MANAGER;
  const normalized = Array.isArray(roles) ? roles : [];
  return normalized[0] || null;
};

const CORE_ACCESS = [ROLES.ADMIN];
const PROPERTY_ACCESS = [ROLES.PROPERTY_MANAGER, ROLES.PROPERTY_ADMIN];
const PROPERTY_OR_INVENTORY = [
  ROLES.PROPERTY_MANAGER,
  ROLES.PROPERTY_ADMIN,
  ROLES.INVENTORY_MANAGER,
];
const PROPERTY_OR_FACILITY = [
  ROLES.PROPERTY_MANAGER,
  ROLES.PROPERTY_ADMIN,
  ROLES.FACILITY_MANAGER,
];
const FACILITY_ACCESS = [ROLES.FACILITY_MANAGER, ROLES.MANAGER];
const COMPLAINT_ACCESS = [ROLES.FACILITY_MANAGER, ROLES.MANAGER];
const PLANNER_ACCESS = [ROLES.FACILITY_MANAGER, ROLES.MANAGER];

const isAdminRole = (roles) => hasRole(roles, ROLES.ADMIN);
const isHrRole = (roles) => hasRole(roles, ROLES.HR);
const isManagerRole = (roles) => hasRole(roles, ROLES.MANAGER);
const isPropertyManagerRole = (roles) => hasRole(roles, ROLES.PROPERTY_MANAGER);

const canSeeAllPages = (roles) => hasAnyRole(roles, CORE_ACCESS);
const canAccessPlanner = (roles) =>
  canSeeAllPages(roles) ||
  hasAnyRole(roles, PLANNER_ACCESS) ||
  hasAnyRole(roles, PROPERTY_ACCESS);
const canAccessAssetManagement = (roles) =>
  canSeeAllPages(roles) ||
  hasAnyRole(roles, [ROLES.FACILITY_MANAGER, ROLES.MANAGER]) ||
  hasAnyRole(roles, PROPERTY_OR_INVENTORY);
const canAccessInventoryManagement = (roles) =>
  canSeeAllPages(roles) || hasAnyRole(roles, PROPERTY_OR_INVENTORY);
const canAccessPropertyManagement = (roles) =>
  canSeeAllPages(roles) || hasAnyRole(roles, PROPERTY_ACCESS);
const canAccessFacilityManagement = (roles) =>
  canSeeAllPages(roles) ||
  hasAnyRole(roles, FACILITY_ACCESS) ||
  hasAnyRole(roles, PROPERTY_OR_FACILITY) ||
  isHrRole(roles);
const canAccessPayrollManagement = (roles) =>
  canSeeAllPages(roles) || hasRole(roles, ROLES.PROPERTY_ADMIN) || isHrRole(roles);
const canAccessReports = (roles) =>
  canSeeAllPages(roles) ||
  hasAnyRole(roles, [ROLES.FACILITY_MANAGER, ROLES.MANAGER]) ||
  hasAnyRole(roles, PROPERTY_OR_INVENTORY);
const canAccessParkingManagement = (roles) =>
  canSeeAllPages(roles) || hasAnyRole(roles, PROPERTY_ACCESS);
const canAccessPropertySettings = (roles) =>
  canSeeAllPages(roles) || hasAnyRole(roles, PROPERTY_ACCESS) || isHrRole(roles);
const canAccessComplaintManagement = (roles) =>
  canSeeAllPages(roles) ||
  hasAnyRole(roles, COMPLAINT_ACCESS) ||
  hasAnyRole(roles, PROPERTY_ACCESS);
const canAccessAmenities = (roles) =>
  canSeeAllPages(roles) || hasAnyRole(roles, PROPERTY_ACCESS);
const canAccessMasterSettings = (roles) => canSeeAllPages(roles);
const canAccessUserManagement = (roles) => canSeeAllPages(roles);
const canAccessUploader = (roles) => canSeeAllPages(roles);

const shouldHideAttendanceForPropertyManager = (roles) =>
  isPropertyManagerRole(roles) && !canSeeAllPages(roles);

export const ROLE_RULES = Object.freeze({
  isAdminRole,
  isHrRole,
  isManagerRole,
  isPropertyManagerRole,
  getEmployeeAccessIdentityRole,
  canSeeAllPages,
  canAccessPlanner,
  canAccessAssetManagement,
  canAccessInventoryManagement,
  canAccessPropertyManagement,
  canAccessFacilityManagement,
  canAccessPayrollManagement,
  canAccessReports,
  canAccessParkingManagement,
  canAccessPropertySettings,
  canAccessComplaintManagement,
  canAccessAmenities,
  canAccessMasterSettings,
  canAccessUserManagement,
  canAccessUploader,
  shouldHideAttendanceForPropertyManager,
});
