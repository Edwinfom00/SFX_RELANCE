export type PermissionName =
  | "users:manage"
  | "worker:manage"
  | "templates:manage"
  | "quotations:cancel"
  | "quotations:send"
  | "logs:view";

export type RoleName = "ADMIN" | "MANAGER" | "VIEWER";

export interface Permission {
  id: number;
  name: PermissionName;
  label: string;
  description: string;
}

export interface Role {
  id: number;
  name: RoleName;
  label: string;
  description: string;
  permissions: Permission[];
}

export interface UserWithRoles {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
}
