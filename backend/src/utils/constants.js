// src/utils/constants.js

/**
 * Application Constants
 * Centralized location for all enum values and constant data
 */

// ============= USER ROLES =============
export const UserRoleEnum = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  STAFF: 'staff',
};

export const AvailableUserRoles = Object.values(UserRoleEnum);

// ============= DEPARTMENT TYPES =============
export const DepartmentTypeEnum = {
  PRODUCTION: 'production',
  SUPPORT: 'support',
  EXECUTIVE: 'executive',
  ADMINISTRATIVE: 'administrative',
};

export const AvailableDepartmentTypes = Object.values(DepartmentTypeEnum);

// ============= EMPLOYMENT STATUS =============
export const EmploymentStatusEnum = {
  ACTIVE: 'active',
  ON_LEAVE: 'on-leave',
  TERMINATED: 'terminated',
  RESIGNED: 'resigned',
};

export const AvailableEmploymentStatus = Object.values(EmploymentStatusEnum);

// ============= CAREER LEVELS =============
export const CareerLevelEnum = {
  ENTRY: 'entry',
  JUNIOR: 'junior',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  MANAGEMENT: 'management',
};

export const AvailableCareerLevels = Object.values(CareerLevelEnum);

// ============= MACHINERY STATUS =============
export const MachineryStatusEnum = {
  OPERATIONAL: 'operational',
  UNDER_MAINTENANCE: 'under-maintenance',
  BREAKDOWN: 'breakdown',
  IDLE: 'idle',
};

export const AvailableMachineryStatus = Object.values(MachineryStatusEnum);

// ============= PRODUCT TYPES =============
export const ProductTypeEnum = {
  INDUSTRIAL_THREAD: 'Industrial Thread',
  TEXTILE_THREAD: 'Textile Thread',
  WIPER_THREAD: 'Wiper Thread',
  LYCRA_THREAD: 'Lycra Thread',
  KHADAR_THREAD: 'Khadar Thread',
  KARANDI_THREAD: 'Karandi Thread',
  WASH_WEAR_THREAD: 'Wash & Wear Thread',
  SPECIALTY_THREAD: 'Specialty Thread',
  CUSTOM_THREAD: 'Custom Thread',
};

export const AvailableProductTypes = Object.values(ProductTypeEnum);

// ============= STAFF ROLES =============
export const StaffRoleEnum = {
  // Engineering & Management
  ENGINEER: 'Engineer',
  ELECTRICAL_ENGINEER: 'Electrical Engineer',
  TECHNICAL_MANAGER: 'Technical Manager',
  
  // Supervision
  FOREMAN: 'Foreman',
  DEPUTY_FOREMAN: 'Deputy Foreman',
  ASSISTANT_FOREMAN: 'Assistant Foreman',
  SHIFT_INCHARGE: 'Shift Incharge',
  SUPERVISOR: 'Supervisor',
  DEPARTMENT_HEAD: 'Department Head',
  
  // Technical Staff
  HEAD_FITTER: 'Head Fitter',
  FITTER: 'Fitter',
  PIPE_FITTER: 'Pipe Fitter',
  HEAD_JOBBER: 'Head Jobber',
  JOBBER: 'Jobber',
  ELECTRICIAN: 'Electrician',
  
  // Operations
  OPERATOR: 'Operator',
  SPARE_OPERATOR: 'Spare Operator',
  DOFFER: 'Doffer',
  MACHINE_WINDER: 'Machine Winder',
  
  // Support
  HELPER: 'Helper',
  WASTE_COLLECTOR: 'Waste Collector',
  SWEEPER: 'Sweeper',
  MALI: 'Mali',
  SECURITY_GUARD: 'Security Guard',
  COOK: 'Cook',
  
  // Administrative
  ACCOUNTANT: 'Accountant',
  PURCHASER: 'Purchaser',
  TAX_OFFICER: 'Tax Officer',
  TIME_KEEPER: 'Time Keeper',
  
  // Laboratory
  LAB_INCHARGE: 'Lab Incharge',
  LAB_CLERK: 'Lab Clerk',
  CONE_CHECKER: 'Cone Checker',
  
  // Leadership
  GENERAL_MANAGER: 'General Manager',
  PRODUCTION_INCHARGE: 'Production Incharge',
  LABOUR_OFFICER: 'Labour Officer',
  STORE_INCHARGE: 'Store Incharge',
  PACKING_INCHARGE: 'Packing Incharge',
  MIXING_INCHARGE: 'Mixing Incharge',
};

export const AvailableStaffRoles = Object.values(StaffRoleEnum);

// ============= SHIFT NAMES =============
export const ShiftNameEnum = {
  MORNING: 'Morning',
  EVENING: 'Evening',
  NIGHT: 'Night',
  GENERAL: 'General',
  DAY: 'Day',
};

export const AvailableShiftNames = Object.values(ShiftNameEnum);

// ============= EMPLOYMENT STATUSES (Alternative naming) =============
export const EmploymentStatuses = AvailableEmploymentStatus;

// ============= CAREER LEVELS (Alternative naming) =============
export const CareerLevels = AvailableCareerLevels;