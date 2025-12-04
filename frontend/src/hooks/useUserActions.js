import { useState } from 'react';
import { toast } from "sonner";
import api from '@/lib/api';

const useUserActions = (fetchData, users, setUsers) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', days_valid: 30, role: 'USER' });

  const [isExpirationOpen, setIsExpirationOpen] = useState(false);
  const [isUpdatingExpiration, setIsUpdatingExpiration] = useState(false);
  const [selectedUserForExpiration, setSelectedUserForExpiration] = useState(null);
  const [newDaysValid, setNewDaysValid] = useState(30);

  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [selectedUserForReactivation, setSelectedUserForReactivation] = useState(null);
  const [reactivationDays, setReactivationDays] = useState(30);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/admin/users', newUser);
      toast.success("Usuário criado com sucesso!");
      setIsCreateOpen(false);
      setNewUser({ name: '', email: '', password: '', days_valid: 30, role: 'USER' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao criar usuário.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateExpiration = async () => {
    if (!selectedUserForExpiration) return;
    setIsUpdatingExpiration(true);
    try {
      await api.patch(`/admin/users/${selectedUserForExpiration.id}`, {
        days_valid: parseInt(newDaysValid)
      });
      toast.success("Validade da conta atualizada!");
      setIsExpirationOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar validade.");
    } finally {
      setIsUpdatingExpiration(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`);
      const newStatus = response.data.status;
      
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast.success(`Status atualizado para: ${newStatus}`);
    } catch (error) {
      toast.error("Falha ao atualizar status.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      await fetchData();
      toast.success("Usuário excluído com sucesso");
    } catch (error) {
      toast.error("Falha ao excluir usuário.");
    }
  };
  
  const handleReactivateUser = async (e) => {
    e.preventDefault();
    setIsReactivating(true);
    
    try {
      await api.post(`/admin/users/${selectedUserForReactivation.email}/reactivate`, {
        days_valid: parseInt(reactivationDays)
      });
      
      await fetchData();
      
      setIsReactivateOpen(false);
      setSelectedUserForReactivation(null);
      setReactivationDays(30);
      toast.success(`Usuário reativado com ${reactivationDays} dias de validade!`);
    } catch (error) {
      toast.error("Falha ao reativar usuário.");
    } finally {
      setIsReactivating(false);
    }
  };

  const handlePermanentDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}/permanent`);
      toast.success("Usuário excluído permanentemente!");
      await fetchData();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao excluir usuário permanentemente.");
      return false;
    }
  };

  return {
    // Create User
    isCreateOpen,
    setIsCreateOpen,
    isCreating,
    newUser,
    setNewUser,
    handleCreateUser,
    
    // Expiration
    isExpirationOpen,
    setIsExpirationOpen,
    isUpdatingExpiration,
    selectedUserForExpiration,
    setSelectedUserForExpiration,
    newDaysValid,
    setNewDaysValid,
    handleUpdateExpiration,
    
    // Status & Delete
    handleToggleStatus,
    handleDeleteUser,
    
    // Reactivation
    isReactivateOpen,
    setIsReactivateOpen,
    isReactivating,
    selectedUserForReactivation,
    setSelectedUserForReactivation,
    reactivationDays,
    setReactivationDays,
    handleReactivateUser
  };
};

export default useUserActions;
