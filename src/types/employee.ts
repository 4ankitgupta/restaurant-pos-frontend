export interface Employee {
  id: string;
  name: string;
  employeeCode: string;
  designation?: string;
  biometricId?: string;
  isActive: boolean;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AttendancePunch {
  type: "IN" | "OUT";
  time: string;
}

export interface AttendanceReport {
  employeeId: string;
  name: string;
  employeeCode: string;
  designation?: string;
  status: "IN" | "OUT";
  totalHoursWorked: string;
  punches: AttendancePunch[];
}
