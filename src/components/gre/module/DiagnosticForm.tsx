
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface DiagnosticQuestion {
    id: string;
    text: string;
    weight: number;
}

interface DiagnosticFormProps {
    questions: DiagnosticQuestion[];
    initialAnswers?: Record<string, number>;
    onComplete?: (score: number, answers: Record<string, number>) => void;
}

export function DiagnosticForm({ questions, initialAnswers = {}, onComplete }: DiagnosticFormProps) {
    const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
    const [score, setScore] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const answeredCount = Object.keys(answers).length;
        setProgress((answeredCount / questions.length) * 100);
    }, [answers, questions.length]);

    const handleAnswer = (questionId: string, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: parseInt(value)
        }));
    };

    const calculateScore = () => {
        let totalWeight = 0;
        let earnedWeight = 0;

        questions.forEach(q => {
            totalWeight += q.weight;
            const answer = answers[q.id] || 0; // 0 = No, 1 = Partial, 2 = Yes
            // Map answer to weight: 0 -> 0%, 1 -> 50%, 2 -> 100%
            const multiplier = answer === 2 ? 1 : answer === 1 ? 0.5 : 0;
            earnedWeight += q.weight * multiplier;
        });

        return totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;
    };

    const handleSubmit = () => {
        const finalScore = calculateScore();
        setScore(finalScore);
        setIsSubmitted(true);
        if (onComplete) {
            onComplete(finalScore, answers);
        }
    };

    if (isSubmitted) {
        return (
            <Card className="w-full max-w-2xl mx-auto text-center py-8">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-24 h-24 flex items-center justify-center mb-4">
                        <span className="text-4xl font-bold text-primary">{score.toFixed(0)}%</span>
                    </div>
                    <CardTitle className="text-2xl">Diagnóstico Concluído</CardTitle>
                    <CardDescription>
                        Este é o nível de maturidade atual deste módulo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Progress value={score} className="h-4 w-full" />
                    <p className="mt-4 text-muted-foreground">
                        {score < 50 ? "Nível Inicial: É necessário implementar os processos básicos." :
                            score < 80 ? "Nível Operacional: Processos existem mas precisam de otimização." :
                                "Nível Avançado: Módulo bem estruturado e escalável."}
                    </p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button onClick={() => setIsSubmitted(false)} variant="outline">Revisar Respostas</Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur py-4 z-10 border-b">
                <div>
                    <h2 className="text-lg font-semibold">Avaliação de Maturidade</h2>
                    <p className="text-sm text-muted-foreground">Responda com honestidade para um diagnóstico preciso.</p>
                </div>
                <div className="text-right">
                    <span className="text-sm font-medium">{Math.round(progress)}% Concluído</span>
                    <Progress value={progress} className="w-32 h-2 mt-1" />
                </div>
            </div>

            <div className="space-y-6">
                {questions.map((q, index) => (
                    <Card key={q.id}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium flex gap-3">
                                <span className="bg-muted w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">{index + 1}</span>
                                {q.text}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup
                                value={answers[q.id]?.toString()}
                                onValueChange={(val) => handleAnswer(q.id, val)}
                                className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:gap-6"
                            >
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer flex-1 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                    <RadioGroupItem value="0" id={`q${q.id}-0`} />
                                    <Label htmlFor={`q${q.id}-0`} className="cursor-pointer flex-1">Não Implementado (0%)</Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer flex-1 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                    <RadioGroupItem value="1" id={`q${q.id}-1`} />
                                    <Label htmlFor={`q${q.id}-1`} className="cursor-pointer flex-1">Parcialmente (50%)</Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer flex-1 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                    <RadioGroupItem value="2" id={`q${q.id}-2`} />
                                    <Label htmlFor={`q${q.id}-2`} className="cursor-pointer flex-1">Totalmente (100%)</Label>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-end pt-4 pb-12">
                <Button size="lg" onClick={handleSubmit} disabled={Object.keys(answers).length < questions.length}>
                    Finalizar Diagnóstico
                </Button>
            </div>
        </div>
    );
}
