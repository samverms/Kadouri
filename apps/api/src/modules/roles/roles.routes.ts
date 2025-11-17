import { Router } from 'express'
import { rolesService } from './roles.service'
import { AuthRequest } from '../../middleware/auth'

const router = Router()

// Get all roles
router.get('/roles', async (req, res, next) => {
  try {
    const roles = await rolesService.getAllRoles()
    res.json(roles)
  } catch (error) {
    next(error)
  }
})

// Get role by ID with permissions
router.get('/roles/:id', async (req, res, next) => {
  try {
    const role = await rolesService.getRoleById(req.params.id)
    if (!role) {
      return res.status(404).json({ error: 'Role not found' })
    }
    res.json(role)
  } catch (error) {
    next(error)
  }
})

// Get all permissions
router.get('/permissions', async (req, res, next) => {
  try {
    const permissions = await rolesService.getAllPermissions()
    res.json(permissions)
  } catch (error) {
    next(error)
  }
})

// Create new role
router.post('/roles', async (req, res, next) => {
  try {
    const { name, description } = req.body
    const newRole = await rolesService.createRole({ name, description })
    res.status(201).json(newRole)
  } catch (error) {
    next(error)
  }
})

// Update role
router.patch('/roles/:id', async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body
    const updated = await rolesService.updateRole(req.params.id, { name, description, isActive })
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// Assign permissions to role
router.post('/roles/:id/permissions', async (req, res, next) => {
  try {
    const { permissionIds } = req.body
    const role = await rolesService.assignPermissions(req.params.id, permissionIds)
    res.json(role)
  } catch (error) {
    next(error)
  }
})

// Get current user's role and permissions
router.get('/me/role', async (req: AuthRequest, res, next) => {
  try {
    const clerkUserId = req.userId
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const role = await rolesService.getUserRole(clerkUserId)
    const permissions = await rolesService.getUserPermissions(clerkUserId)

    res.json({ role, permissions })
  } catch (error) {
    next(error)
  }
})

// Assign role to user
router.post('/users/:clerkUserId/role', async (req, res, next) => {
  try {
    const { roleId } = req.body
    const userRole = await rolesService.assignRoleToUser(req.params.clerkUserId, roleId)
    res.json(userRole)
  } catch (error) {
    next(error)
  }
})

// Check permission
router.post('/check-permission', async (req: AuthRequest, res, next) => {
  try {
    const clerkUserId = req.userId
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { module, action } = req.body
    const hasPermission = await rolesService.hasPermission(clerkUserId, module, action)
    res.json({ hasPermission })
  } catch (error) {
    next(error)
  }
})

export default router
