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

const ExpirationDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedUser, 
  newDaysValid, 
  setNewDaysValid, 
  onUpdate, 
  isUpdating 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Validade da Conta</DialogTitle>
          <DialogDescription>
            Defina quantos dias de acesso o usuário <b>{selectedUser?.name}</b> terá a partir de hoje.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="new_days">Dias de Acesso (a partir de hoje)</Label>
          <Input 
            id="new_days" 
            type="text" 
            placeholder="Ex: 30, 60, 365..."
            value={newDaysValid}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setNewDaysValid(value);
            }}
          />
        </div>
        <DialogFooter>
          <Button onClick={onUpdate} disabled={isUpdating}>
            {isUpdating ? <CustomLoader size="sm" /> : "Salvar Alteração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpirationDialog;
