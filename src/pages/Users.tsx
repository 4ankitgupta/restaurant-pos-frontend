import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Users as UsersIcon, Mail, Phone, Shield } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { useApi } from '@/hooks/useApi';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN_STAFF';
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const { loading: usersLoading, execute: executeGetUsers } = useApi<{ data: User[] }>();
  const { loading: createLoading, execute: executeCreate } = useApi();
  const { loading: updateLoading, execute: executeUpdate } = useApi();
  const { loading: deleteLoading, execute: executeDelete } = useApi();

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: '' as User['role'] | ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await executeGetUsers(() => apiService.getUsers());
      if (response) {
        // API returns users array directly, not wrapped in data property
        setUsers(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await executeCreate(() => 
        apiService.register({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          password: userForm.password,
          role: userForm.role as string
        })
      );
      toast({ title: "Success", description: "User created successfully" });
      setUserForm({ name: '', email: '', phone: '', password: '', role: '' });
      setIsAddUserOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      await executeUpdate(() => 
        apiService.updateUser(editingUser.id, {
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role as string
        })
      );
      toast({ title: "Success", description: "User updated successfully" });
      setEditingUser(null);
      setUserForm({ name: '', email: '', phone: '', password: '', role: '' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await executeDelete(() => apiService.deleteUser(userId));
      toast({ title: "Success", description: "User deleted successfully" });
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '', // Don't show existing password
      role: user.role
    });
  };

  const getRoleBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'MANAGER':
        return 'default';
      case 'CASHIER':
        return 'secondary';
      case 'WAITER':
        return 'outline';
      case 'KITCHEN_STAFF':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredUsers = selectedRole === 'all' 
    ? users 
    : users.filter(user => user.role === selectedRole);

  const loading = usersLoading || createLoading || updateLoading || deleteLoading;

  const roles = ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'KITCHEN_STAFF'];
  const roleDisplayNames = {
    'ADMIN': 'Administrator',
    'MANAGER': 'Manager',
    'CASHIER': 'Cashier',
    'WAITER': 'Waiter',
    'KITCHEN_STAFF': 'Kitchen Staff'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Dialog open={isAddUserOpen || !!editingUser} onOpenChange={(open) => {
          if (!open) {
            setIsAddUserOpen(false);
            setEditingUser(null);
            setUserForm({ name: '', email: '', phone: '', password: '', role: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="user-name">Name</Label>
                <Input
                  id="user-name"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="user-phone">Phone</Label>
                <Input
                  id="user-phone"
                  value={userForm.phone}
                  onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              {!editingUser && (
                <div>
                  <Label htmlFor="user-password">Password</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    required={!editingUser}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="user-role">Role</Label>
                <Select value={userForm.role} onValueChange={(value) => setUserForm(prev => ({ ...prev, role: value as User['role'] }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleDisplayNames[role as keyof typeof roleDisplayNames]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading}>
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedRole === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRole('all')}
            >
              All Users ({users.length})
            </Button>
            {roles.map((role) => {
              const userCount = users.filter(user => user.role === role).length;
              return (
                <Button
                  key={role}
                  variant={selectedRole === role ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRole(role)}
                >
                  {roleDisplayNames[role as keyof typeof roleDisplayNames]} ({userCount})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <UsersIcon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {roleDisplayNames[user.role]}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => startEditUser(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{user.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 mr-2" />
                  User ID: {user.id.slice(0, 8)}...
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <UsersIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
            <p className="text-muted-foreground">
              {selectedRole === 'all' 
                ? 'No users found. Add some users to get started.'
                : 'No users with this role. Try selecting a different role.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Users;