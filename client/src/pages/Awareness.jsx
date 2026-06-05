import { useState } from 'react';
import {
  AlertTriangle,
  UserX,
  MessageSquare,
  Link2,
  Gift,
  KeyRound,
  Shield,
  Eye,
  Lock,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const RED_FLAGS = [
  { icon: AlertTriangle, title: 'Urgency & Threats', desc: 'Messages demanding immediate action or threatening account closure are designed to bypass rational thinking.' },
  { icon: UserX, title: 'Sender Mismatch', desc: 'The display name may say "Google" but the actual email address is from an unrelated domain.' },
  { icon: MessageSquare, title: 'Generic Greeting', desc: 'Phishing emails often use "Dear Customer" instead of your actual name, indicating bulk targeting.' },
  { icon: Link2, title: 'Suspicious Links', desc: 'Hover over links before clicking. Phishing URLs often mimic real domains with subtle misspellings.' },
  { icon: Gift, title: 'Too Good to Be True', desc: 'Unexpected prizes, refunds, or job offers are classic lures to steal personal information.' },
  { icon: KeyRound, title: 'Credential Requests', desc: 'Legitimate services rarely ask you to verify passwords via email links. This is the #1 red flag.' },
];

const PREVENTION_TIPS = [
  { icon: Eye, text: 'Verify sender email addresses — look beyond the display name' },
  { icon: Link2, text: 'Hover over links to inspect the actual URL before clicking' },
  { icon: Lock, text: 'Never enter credentials on pages reached via email links' },
  { icon: Shield, text: 'Enable multi-factor authentication on all important accounts' },
  { icon: RefreshCw, text: 'Keep software and browsers updated with latest security patches' },
  { icon: AlertTriangle, text: 'Be skeptical of urgent requests, especially about money or access' },
  { icon: MessageSquare, text: 'Contact the organization directly using known phone numbers or websites' },
  { icon: KeyRound, text: 'Use a password manager to avoid reusing passwords across sites' },
  { icon: Eye, text: 'Report suspicious emails to your IT security team immediately' },
  { icon: Shield, text: 'Participate in security awareness training regularly' },
];

const RESPONSE_STEPS = [
  'Disconnect from the network if you submitted credentials on a suspicious page',
  'Change passwords immediately for any affected accounts',
  'Enable multi-factor authentication if not already active',
  'Report the incident to your IT security team or supervisor',
  'Monitor accounts for unauthorized activity over the following weeks',
];

const QUIZ_QUESTIONS = [
  {
    question: 'You receive an email from "IT Support" asking you to verify your password via a link. What should you do?',
    options: [
      'Click the link and enter your password to stay secure',
      'Reply to the email with your password',
      'Do not click the link — contact IT through official channels',
      'Forward the email to all colleagues as a warning',
    ],
    correct: 2,
  },
  {
    question: 'Which is the BEST way to check if a link in an email is safe?',
    options: [
      'Click it quickly before it expires',
      'Hover over it to see the actual URL destination',
      'Trust it if the email looks professionally designed',
      'Check if the email has a company logo',
    ],
    correct: 1,
  },
  {
    question: 'A phishing email says your account will be deleted in 2 hours unless you act now. This technique is called:',
    options: [
      'Social engineering through urgency',
      'Two-factor authentication',
      'Encryption verification',
      'Account synchronization',
    ],
    correct: 0,
  },
  {
    question: 'You accidentally entered your password on a suspicious website. What is your FIRST action?',
    options: [
      'Wait and see if anything happens',
      'Delete the email that led you there',
      'Immediately change your password and report the incident',
      'Share the link on social media to warn others',
    ],
    correct: 2,
  },
  {
    question: 'Which email address is MOST likely a phishing attempt pretending to be from Google?',
    options: [
      'security@google.com',
      'noreply@accounts.google.com',
      'google-security@verify-account.net',
      'support@googlemail.com',
    ],
    correct: 2,
  },
];

export default function Awareness() {
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (optionIndex) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setShowResults(true);
    }
  };

  const score = answers.filter((a, i) => a === QUIZ_QUESTIONS[i].correct).length;
  const passed = score >= 4;

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQ(0);
    setAnswers([]);
    setShowResults(false);
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-2">Understanding Phishing Attacks</h1>
      <p className="text-gray-500 text-sm mb-8">Educational content for security awareness training</p>

      <section className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-6">How Phishing Works</h2>
        <div className="flex items-center justify-between gap-2">
          {[
            { step: '1', title: 'Attacker Crafts Email', desc: 'Fake sender, urgent message, malicious link', color: 'bg-accent' },
            { step: '2', title: 'Victim Receives Email', desc: 'Looks legitimate, triggers emotional response', color: 'bg-warning' },
            { step: '3', title: 'Victim Clicks Link', desc: 'Redirected to fake login page', color: 'bg-yellow-600' },
            { step: '4', title: 'Credentials Stolen', desc: 'Data captured, account compromised', color: 'bg-red-800' },
          ].map((item, i, arr) => (
            <div key={item.step} className="flex items-center flex-1">
              <div className="flex-1 text-center">
                <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2`}>
                  {item.step}
                </div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="text-gray-600 text-2xl px-1">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Red Flags to Watch For</h2>
        <div className="grid grid-cols-3 gap-4">
          {RED_FLAGS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card">
              <Icon className="w-6 h-6 text-accent mb-3" />
              <h3 className="font-medium text-white text-sm mb-1">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">10 Prevention Tips</h2>
        <ol className="space-y-3">
          {PREVENTION_TIPS.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="font-mono text-accent font-bold w-6 flex-shrink-0">{i + 1}.</span>
              <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">{text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">What To Do If You're Phished</h2>
        <div className="space-y-3">
          {RESPONSE_STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-accent/20 text-accent rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-gray-300 pt-1">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Test Your Awareness</h2>

        {!quizStarted && !showResults && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">5 questions · Pass with 4 or more correct</p>
            <button onClick={() => setQuizStarted(true)} className="btn-primary">
              Start Quiz
            </button>
          </div>
        )}

        {quizStarted && !showResults && (
          <div>
            <p className="text-xs text-gray-500 mb-4">
              Question {currentQ + 1} of {QUIZ_QUESTIONS.length}
            </p>
            <p className="text-white font-medium mb-4">{QUIZ_QUESTIONS[currentQ].question}</p>
            <div className="space-y-2">
              {QUIZ_QUESTIONS[currentQ].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-accent hover:bg-accent/10 text-sm text-gray-300 transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {showResults && (
          <div className="text-center py-8">
            {passed ? (
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            )}
            <h3 className="text-xl font-bold text-white mb-2">
              Score: {score}/{QUIZ_QUESTIONS.length}
            </h3>
            <p className={`text-sm mb-6 ${passed ? 'text-success' : 'text-accent'}`}>
              {passed
                ? 'Great job! You demonstrate strong phishing awareness.'
                : 'Keep learning — review the sections above and try again.'}
            </p>
            <button onClick={resetQuiz} className="btn-secondary">Retake Quiz</button>
          </div>
        )}
      </section>
    </div>
  );
}
