import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, Lightbulb, Mail, ArrowRight, Eye } from 'lucide-react';
import { AdPlacement } from '@/components/AdPlacement';
import { useAdFrequency } from '@/hooks/useAdFrequency';

interface Question {
  question: string;
  answer: string;
}

interface Evaluation {
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
  suggestedAnswer: string;
}

export const InterviewHelper = () => {
  const { toast } = useToast();
  const { canShowAd, recordImpression, getRemainingLimits, cooldownRemaining } = useAdFrequency();
  
  const [step, setStep] = useState<'email' | 'setup' | 'loading-content' | 'answering' | 'loading-results' | 'results'>('email');
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [questionCount, setQuestionCount] = useState('3');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Question[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle loading screens with ad frequency management
  useEffect(() => {
    if (step === 'loading-content' || step === 'loading-results') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setLoadingProgress(0);
      setCanProceed(false);

      const showingAd = canShowAd();
      
      // Minimum loading time based on whether we show an ad
      const minTime = showingAd ? 4000 : 1500; // 4s with ad, 1.5s without
      const interval = 100;
      let elapsed = 0;

      if (showingAd) {
        recordImpression();
      }

      const timer = setInterval(() => {
        elapsed += interval;
        const progress = Math.min((elapsed / minTime) * 100, 100);
        setLoadingProgress(progress);
        
        if (elapsed >= minTime) {
          clearInterval(timer);
          setCanProceed(true);
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [step, currentQuestionIndex, currentResultIndex, canShowAd, recordImpression]);

  const handleEmailSubmit = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    setStep('setup');
  };

  const handleGenerateQuestions = async () => {
    if (!jobTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a job title',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          email,
          job_title: jobTitle,
          question_count: parseInt(questionCount)
        })
        .select('id')
        .single();

      if (sessionError) throw sessionError;
      setSessionId(sessionData.id);

      const { data, error } = await supabase.functions.invoke('interview-helper', {
        body: {
          action: 'generate',
          jobTitle: jobTitle.trim(),
          questionCount: parseInt(questionCount),
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setQuestions(data.questions);
      setAnswers([]);
      setCurrentQuestionIndex(0);
      setCurrentAnswer('');
      setStep('loading-content');
      
      toast({
        title: 'Success',
        description: `Generated ${data.questions.length} interview questions`,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate questions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToQuestion = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep('answering');
  };

  const handleNextQuestion = () => {
    if (!currentAnswer.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide an answer before moving to the next question',
        variant: 'destructive',
      });
      return;
    }

    const newAnswers = [
      ...answers,
      { question: questions[currentQuestionIndex], answer: currentAnswer },
    ];
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setStep('loading-content');
    } else {
      handleSubmitForEvaluation(newAnswers);
    }
  };

  const handleSubmitForEvaluation = async (finalAnswers: Question[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-helper', {
        body: {
          action: 'evaluate',
          jobTitle,
          answers: finalAnswers,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setEvaluation(data.evaluation);
      setCurrentResultIndex(0);
      
      const total = data.evaluation.reduce((sum: number, e: Evaluation) => sum + e.score, 0);
      const avgScore = parseFloat((total / data.evaluation.length).toFixed(1));

      if (sessionId) {
        await supabase
          .from('interview_sessions')
          .update({
            results: data.evaluation,
            average_score: avgScore
          })
          .eq('id', sessionId);
      }

      setStep('loading-results');
      
      setSendingEmail(true);
      try {
        const { error: emailError } = await supabase.functions.invoke('send-interview-results', {
          body: {
            email,
            jobTitle,
            sessionId,
            evaluation: data.evaluation,
            averageScore: avgScore
          }
        });

        if (emailError) {
          console.error("Error sending email:", emailError);
        }
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
      } finally {
        setSendingEmail(false);
      }
      
      toast({
        title: 'Success',
        description: 'Your answers have been evaluated',
      });
    } catch (error) {
      console.error('Error evaluating answers:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to evaluate answers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToResult = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep('results');
  };

  const handleNextResult = () => {
    if (currentResultIndex < evaluation.length - 1) {
      setCurrentResultIndex(currentResultIndex + 1);
      setStep('loading-results');
    }
  };

  const handleReset = () => {
    setStep('email');
    setEmail('');
    setSessionId(null);
    setJobTitle('');
    setQuestionCount('3');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer('');
    setEvaluation([]);
    setCurrentResultIndex(0);
  };

  const getAverageScore = () => {
    if (evaluation.length === 0) return 0;
    const total = evaluation.reduce((sum, e) => sum + e.score, 0);
    return (total / evaluation.length).toFixed(1);
  };

  const currentResult = evaluation[currentResultIndex];
  const limits = getRemainingLimits();
  const showAd = canShowAd() || cooldownRemaining === 0;

  return (
    <div ref={containerRef} className="space-y-6">
      {step === 'email' && (
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Get Your Results via Email</CardTitle>
            <CardDescription className="text-base">
              Enter your email to receive detailed interview feedback and related job opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
              />
            </div>

            <Button 
              onClick={handleEmailSubmit}
              className="w-full"
              size="lg"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'setup' && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Interview Practice Setup</CardTitle>
            <CardDescription>
              Practice your interview skills with AI-generated questions and get personalized feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Software Developer, Marketing Manager"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="questionCount">Number of Questions</Label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger id="questionCount">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Questions</SelectItem>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="7">7 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleGenerateQuestions} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                'Start Practice Interview'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'loading-content' && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Preparing Question {currentQuestionIndex + 1}</CardTitle>
              <CardDescription className="text-base">
                Take a moment to prepare yourself for the next interview question
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Only show ads if within limits */}
              {showAd && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground text-center mb-4">Sponsored Content</p>
                  <AdPlacement type="display" className="my-0" />
                </div>
              )}

              <div className="text-center space-y-4">
                {!canProceed ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Loading your question...
                    </p>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-100"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleProceedToQuestion} size="lg" className="w-full">
                    View Question {currentQuestionIndex + 1} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'answering' && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <CardDescription className="text-lg font-medium text-foreground">
              {questions[currentQuestionIndex]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="answer">Your Answer</Label>
              <Textarea
                id="answer"
                placeholder="Type your answer here..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                rows={6}
              />
            </div>
            <Button 
              onClick={handleNextQuestion} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : currentQuestionIndex < questions.length - 1 ? (
                'Submit & Next Question'
              ) : (
                'Submit for Evaluation'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'loading-results' && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {currentResultIndex === 0 ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <Lightbulb className="w-8 h-8 text-primary" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {currentResultIndex === 0 ? 'Your Results Are Ready!' : `Preparing Result ${currentResultIndex + 1}`}
              </CardTitle>
              <CardDescription className="text-base">
                {currentResultIndex === 0 
                  ? `Overall Score: ${getAverageScore()}/10 - Let's review your answers`
                  : 'See how you performed on this question'
                }
              </CardDescription>
              {currentResultIndex === 0 && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  ✓ Results sent to {email}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Only show ads if within limits */}
              {showAd && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground text-center mb-4">Sponsored Content</p>
                  <AdPlacement type="display" className="my-0" />
                </div>
              )}

              <div className="text-center space-y-4">
                {!canProceed ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Loading your feedback...
                    </p>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-100"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleProceedToResult} size="lg" className="w-full">
                    View Feedback {currentResultIndex + 1} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'results' && currentResult && (
        <div className="space-y-6">
          {/* Score summary card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="text-center py-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                  <p className="text-2xl font-bold text-primary">{getAverageScore()}/10</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Viewing</p>
                  <p className="text-lg font-semibold">{currentResultIndex + 1} of {evaluation.length}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Current result card */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Question {currentResultIndex + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  {currentResult.score >= 7 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : currentResult.score >= 5 ? (
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-xl font-bold">{currentResult.score}/10</span>
                </div>
              </div>
              <CardDescription className="text-base font-medium text-foreground">
                {currentResult.question}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Your Answer:</h4>
                <p className="text-muted-foreground">{currentResult.userAnswer}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Feedback:</h4>
                <p className="text-muted-foreground">{currentResult.feedback}</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Suggested Better Answer:
                </h4>
                <p className="text-muted-foreground">{currentResult.suggestedAnswer}</p>
              </div>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex gap-4">
            {currentResultIndex < evaluation.length - 1 ? (
              <Button onClick={handleNextResult} className="flex-1" size="lg">
                Next Result ({currentResultIndex + 2} of {evaluation.length}) <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleReset} className="flex-1" size="lg">
                Start New Practice Session
              </Button>
            )}
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center gap-2">
            {evaluation.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index <= currentResultIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
