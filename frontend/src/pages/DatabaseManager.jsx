import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Database, 
  Table as TableIcon, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  RefreshCw,
  ChevronRight,
  Search
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import api from '@/lib/api';

const DatabaseManager = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null); // null = creating new
  const [jsonContent, setJsonContent] = useState("");

  useEffect(() => {
    if (userRole !== 'ADMIN') {
      toast.error("Acesso negado.");
      navigate('/');
    } else {
      fetchCollections();
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (selectedCollection) {
      fetchDocuments(selectedCollection);
    }
  }, [selectedCollection]);

  const fetchCollections = async () => {
    try {
      const response = await api.get('/admin/db/collections');
      setCollections(response.data);
      if (response.data.length > 0 && !selectedCollection) {
        setSelectedCollection(response.data[0]);
      }
    } catch (error) {
      toast.error("Erro ao listar coleções.");
    }
  };

  const fetchDocuments = async (collectionName) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/admin/db/${collectionName}`);
      setDocuments(response.data);
    } catch (error) {
      toast.error("Erro ao buscar documentos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const parsedDoc = JSON.parse(jsonContent);
      
      if (editingDoc) {
        // Update
        await api.put(`/admin/db/${selectedCollection}/${editingDoc._id}`, parsedDoc);
        toast.success("Documento atualizado!");
      } else {
        // Create
        await api.post(`/admin/db/${selectedCollection}`, parsedDoc);
        toast.success("Documento criado!");
      }
      
      setIsEditorOpen(false);
      fetchDocuments(selectedCollection);
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error("JSON inválido. Verifique a sintaxe.");
      } else {
        toast.error("Erro ao salvar documento.");
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/db/${selectedCollection}/${id}`);
      toast.success("Documento excluído.");
      fetchDocuments(selectedCollection);
    } catch (error) {
      toast.error("Erro ao excluir documento.");
    }
  };

  const openEditor = (doc = null) => {
    setEditingDoc(doc);
    setJsonContent(JSON.stringify(doc || {}, null, 2));
    setIsEditorOpen(true);
  };

  if (userRole !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Database className="h-8 w-8 text-primary" /> Gerenciador de Banco de Dados
            </h1>
            <p className="text-slate-500 mt-1">
              Acesso direto às coleções e documentos do MongoDB.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar: Collections */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Coleções</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {collections.map(col => (
                  <Button
                    key={col}
                    variant={selectedCollection === col ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCollection(col)}
                  >
                    <TableIcon className="mr-2 h-4 w-4" />
                    {col}
                    {selectedCollection === col && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main: Documents */}
          <Card className="lg:col-span-3 min-h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {selectedCollection}
                  <Badge variant="outline" className="ml-2 font-normal">
                    {documents.length} documentos
                  </Badge>
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fetchDocuments(selectedCollection)}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button size="sm" onClick={() => openEditor(null)}>
                  <Plus className="h-4 w-4 mr-2" /> Novo Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="divide-y">
                  {documents.map((doc) => (
                    <div key={doc._id} className="p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="font-mono text-xs">
                              _id: {doc._id}
                            </Badge>
                          </div>
                          <pre className="text-xs text-muted-foreground font-mono bg-slate-100 p-2 rounded overflow-x-auto max-h-32">
                            {JSON.stringify(doc, null, 2)}
                          </pre>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditor(doc)}>
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação é irreversível. O documento será removido permanentemente do banco de dados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(doc._id)} className="bg-red-600">
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      Nenhum documento encontrado nesta coleção.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* JSON Editor Dialog */}
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingDoc ? "Editar Documento" : "Novo Documento"}
              </DialogTitle>
              <DialogDescription>
                Edite o objeto JSON abaixo. Certifique-se de manter a sintaxe correta.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 min-h-[400px] border rounded-md overflow-hidden">
              <Textarea 
                className="w-full h-full font-mono text-sm p-4 resize-none border-0 focus-visible:ring-0"
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                spellCheck={false}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" /> Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default DatabaseManager;
