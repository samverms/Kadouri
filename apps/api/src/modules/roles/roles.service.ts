import { db } from '../../db'
import { roles, permissions, rolePermissions, userRoles } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

export class RolesService {
  // Get all roles
  async getAllRoles() {
    return await db.select().from(roles).where(eq(roles.isActive, true))
  }

  // Get role by ID with permissions
  async getRoleById(roleId: string) {
    const role = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1)
    
    if (!role.length) {
      return null
    }

    const perms = await db
      .select({
        id: permissions.id,
        module: permissions.module,
        action: permissions.action,
        description: permissions.description,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId))

    return {
      ...role[0],
      permissions: perms,
    }
  }

  // Get all permissions
  async getAllPermissions() {
    return await db.select().from(permissions)
  }

  // Create new role
  async createRole(data: { name: string; description?: string }) {
    const [newRole] = await db.insert(roles).values(data).returning()
    return newRole
  }

  // Update role
  async updateRole(roleId: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const [updated] = await db
      .update(roles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(roles.id, roleId))
      .returning()
    return updated
  }

  // Assign permissions to role
  async assignPermissions(roleId: string, permissionIds: string[]) {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))
    
    if (permissionIds.length > 0) {
      const perms = permissionIds.map((permId) => ({
        roleId,
        permissionId: permId,
      }))
      await db.insert(rolePermissions).values(perms)
    }
    
    return this.getRoleById(roleId)
  }

  // Get user role
  async getUserRole(clerkUserId: string) {
    const [userRole] = await db
      .select({
        roleId: userRoles.roleId,
        roleName: roles.name,
        roleDescription: roles.description,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.clerkUserId, clerkUserId))
      .limit(1)

    return userRole || null
  }

  // Get user permissions
  async getUserPermissions(clerkUserId: string) {
    const userRole = await this.getUserRole(clerkUserId)
    
    if (!userRole) {
      return []
    }

    const perms = await db
      .select({
        module: permissions.module,
        action: permissions.action,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, userRole.roleId))

    return perms
  }

  // Assign role to user
  async assignRoleToUser(clerkUserId: string, roleId: string) {
    const existing = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.clerkUserId, clerkUserId))
      .limit(1)

    if (existing.length > 0) {
      const [updated] = await db
        .update(userRoles)
        .set({ roleId, updatedAt: new Date() })
        .where(eq(userRoles.clerkUserId, clerkUserId))
        .returning()
      return updated
    } else {
      const [newUserRole] = await db
        .insert(userRoles)
        .values({ clerkUserId, roleId })
        .returning()
      return newUserRole
    }
  }

  // Check if user has permission
  async hasPermission(clerkUserId: string, module: string, action: string): Promise<boolean> {
    const perms = await this.getUserPermissions(clerkUserId)
    return perms.some((p) => p.module === module && p.action === action)
  }
}

export const rolesService = new RolesService()
