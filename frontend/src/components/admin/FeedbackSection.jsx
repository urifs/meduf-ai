import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, ThumbsDown, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const FeedbackSection = ({ 
  feedbacks, 
  feedbackStats, 
  formatDate, 
  onViewFeedback 
}) => {
  return (
    <div className="mt-12">
      <Card className="shadow-lg border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Feedbacks dos Usuários
              </CardTitle>
              <CardDescription className="mt-2">
                Avaliações sobre as análises realizadas pela IA
              </CardDescription>
            </div>
            {feedbackStats && (
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{feedbackStats.helpful}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    Útil
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{feedbackStats.notHelpful}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <ThumbsDown className="h-3 w-3" />
                    Não útil
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {feedbackStats.total > 0 
                      ? Math.round((feedbackStats.helpful / feedbackStats.total) * 100) 
                      : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Taxa de satisfação</div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Gráfico de Pizza */}
          {feedbackStats && feedbackStats.total > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Distribuição de Avaliações</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Útil', value: feedbackStats.helpful, color: '#22c55e' },
                      { name: 'Não útil', value: feedbackStats.notHelpful, color: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Útil', value: feedbackStats.helpful, color: '#22c55e' },
                      { name: 'Não útil', value: feedbackStats.notHelpful, color: '#ef4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          
          <div className="rounded-md border max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Usuário</TableHead>
                  <TableHead>Tipo de Análise</TableHead>
                  <TableHead className="w-[120px] text-center">Feedback</TableHead>
                  <TableHead className="w-[150px]">Data</TableHead>
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum feedback registrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  feedbacks.map((feedback, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{feedback.user_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {feedback.analysis_type === 'diagnosis' && 'Diagnóstico'}
                          {feedback.analysis_type === 'simple-diagnosis' && 'Diagnóstico Simples'}
                          {feedback.analysis_type === 'drug-interaction' && 'Interação'}
                          {feedback.analysis_type === 'medication-guide' && 'Guia Farmacológico'}
                          {feedback.analysis_type === 'toxicology' && 'Guia Toxicológico'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {feedback.is_helpful ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            Útil
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 flex items-center gap-1">
                            <ThumbsDown className="h-3 w-3" />
                            Não útil
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(feedback.timestamp)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewFeedback(feedback)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackSection;
