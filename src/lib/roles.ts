export const STAFF_MANAGER_ROLES = [
  "super-admin",
  "admin",
  "manager",
  "general_manager",
  "regional_manager",
];

export const SCOPE_COUNTY_ROLES = [
  "manager",
  "general_manager",
  "regional_manager",
];

export function canAccessRoute(role: string, path: string): boolean {
  const normalizedRole = role.toLowerCase().replace("_", "-");
  
  // Super-admin and admin can access everything
  if (normalizedRole === "super-admin" || normalizedRole === "admin") {
    return true;
  }
  
  // Settings is restricted to admin/super-admin
  if (path.includes("settings")) {
    return normalizedRole === "super-admin" || normalizedRole === "admin";
  }
  
  // Users/agents/photographers management usually requires higher-level staff roles
  if (path.includes("users") || path.includes("agents") || path.includes("photographers")) {
    return [
      "super-admin",
      "admin",
      "manager",
      "general-manager",
      "regional-manager",
      "supervisor",
      "team-lead"
    ].includes(normalizedRole);
  }
  
  // Properties and reservations can be viewed by most roles (including agents/photographers)
  return true;
}
