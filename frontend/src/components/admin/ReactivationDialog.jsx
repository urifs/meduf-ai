import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomLoader } from '@/components/ui/custom-loader';

const ReactivationDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedUser, 
  reactivationDays, 
  setReactivationDays, 
  onSubmit, 
  isReactivating 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reativar Conta de Usuário</DialogTitle>
          <DialogDescription>
            Restaure o acesso de <b>{selectedUser?.name}</b> ao sistema definindo um novo período de validade.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reactivation_days">Dias de Acesso (a partir de hoje)</Label>
            <Input 
              id="reactivation_days" 
              type="text" 
              placeholder="Ex: 30, 60, 365..."
              value={reactivationDays}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setReactivationDays(value ? parseInt(value) : '');
              }}
              required
            />
            <p className="text-xs text-muted-foreground">
              O usuário terá acesso até {reactivationDays ? new Date(Date.now() + reactivationDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR') : '---'}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isReactivating} className="bg-green-600 hover:bg-green-700">
              {isReactivating ? <CustomLoader size="sm" /> : "Reativar Conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReactivationDialog;
