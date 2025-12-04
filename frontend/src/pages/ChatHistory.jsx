import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Search, Calendar, Copy, Check, BrainCircuit, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import api from '@/lib/api';

const ChatHistory = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedText, setCopiedText] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const response = await api.get('/my-chat-history');
      setChatHistory(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      toast.error("Erro ao carregar histórico de conversas.");
      setChatHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      toast.success('Texto copiado!');
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar texto.');
    }
  };

  const filteredChats = chatHistory.filter(chat =>
    chat.user_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.ai_response?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPreview = (text, maxLength = 100) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" /> Minhas Conversas com IA
            </h1>
            <p className="text-muted-foreground mt-1">
              Histórico completo de todas as suas consultas com o assistente médico IA.
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar nas conversas..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Carregando histórico...</p>
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Nenhuma conversa encontrada</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  Suas conversas com o assistente IA aparecerão aqui.
                </p>
                <Button className="mt-6" asChild>
                  <a href="/">Começar Nova Conversa</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChats.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma conversa encontrada com os termos de busca.</p>
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <div 
                      key={chat.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/30 dark:hover:bg-violet-950/10 cursor-pointer transition-all group"
                      onClick={() => {
                        setSelectedChat(chat);
                        setIsDialogOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                              {getPreview(chat.user_message, 150)}
                            </p>
                          </div>
                          <div className="flex items-start gap-2 pl-6">
                            <BrainCircuit className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              {getPreview(chat.ai_response, 120)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(chat.created_at)}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Meduf 2.0 Clinic
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog for full conversation */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-500" />
                Detalhes da Conversa
              </DialogTitle>
            </DialogHeader>
            
            {selectedChat && (
              <div className="space-y-6 mt-4">
                {/* Date and Model Info */}
                <Card className="bg-slate-50 dark:bg-slate-900/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">{formatDate(selectedChat.created_at)}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {selectedChat.model || 'gemini-2.0-flash'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* User Question */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium text-sm">Sua Pergunta</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(selectedChat.user_message, 'question')}
                    >
                      {copiedText === 'question' ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30">
                    <CardContent className="p-4">
                      <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {selectedChat.user_message}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Response */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <BrainCircuit className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-sm">Resposta da IA</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(selectedChat.ai_response, 'answer')}
                    >
                      {copiedText === 'answer' ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30">
                    <CardContent className="p-4">
                      <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                        {selectedChat.ai_response}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ChatHistory;
