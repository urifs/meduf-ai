import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { Users, Trash2, Search, MoreHorizontal, CalendarClock, Ban, Unlock, RotateCcw } from 'lucide-react';

const UserManagementTabs = ({ 
  users,
  deletedUsers,
  searchTerm,
  setSearchTerm,
  formatDate,
  getDaysRemaining,
  getDaysColor,
  onUserClick,
  onChangeExpiration,
  onToggleStatus,
  onDeleteUser,
  onReactivateUser,
  onPermanentDeleteUser
}) => {
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="xl:col-span-2 space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciar Usuários</CardTitle>
            <CardDescription>Lista completa de contas criadas.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar nome ou email..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários Ativos ({users.length})
              </TabsTrigger>
              <TabsTrigger value="deleted" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Contas Excluídas ({deletedUsers.length})
              </TabsTrigger>
            </TabsList>

            {/* Active Users Tab */}
            <TabsContent value="active">
              <div className="rounded-md border max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50 z-10">
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Nenhum usuário encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <button 
                                onClick={() => onUserClick(user)}
                                className="font-medium text-primary hover:underline cursor-pointer text-left"
                              >
                                {user.name}
                              </button>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={user.role === 'ADMIN' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-slate-200 bg-slate-50 text-slate-700'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs ${getDaysColor(user.expiration_date)}`}>
                              {getDaysRemaining(user.expiration_date)}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={(e) => {
                                  e.preventDefault();
                                  onChangeExpiration(user);
                                }}>
                                  <CalendarClock className="mr-2 h-4 w-4" /> Alterar Validade
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onToggleStatus(user.id, user.status)}>
                                  {user.status === 'Ativo' ? (
                                    <><Ban className="mr-2 h-4 w-4" /> Bloquear Acesso</>
                                  ) : (
                                    <><Unlock className="mr-2 h-4 w-4" /> Desbloquear</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" /> Excluir Conta
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir usuário permanentemente?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso excluirá a conta de <b>{user.name}</b> e todo o histórico de consultas.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700">
                                        Confirmar Exclusão
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Deleted Users Tab */}
            <TabsContent value="deleted">
              <div className="rounded-md border max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50 z-10">
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Data de Exclusão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Nenhuma conta excluída.
                        </TableCell>
                      </TableRow>
                    ) : (
                      deletedUsers.map((user) => (
                        <TableRow key={user.email} className="bg-red-50/30">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-700">{user.name}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-600">
                              {user.role || 'USER'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-red-600">
                            {formatDate(user.deleted_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-300 hover:bg-green-50"
                                onClick={() => onReactivateUser(user)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reativar
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir Definitivamente
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Definitivamente?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação é <strong>PERMANENTE</strong> e não pode ser desfeita. 
                                      O usuário <strong>{user.name}</strong> ({user.email}) será 
                                      removido completamente do banco de dados.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onPermanentDeleteUser(user.email)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir Permanentemente
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementTabs;
