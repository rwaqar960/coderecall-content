import React, {useState} from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

/**
 * Renders one quiz (matching coderecall-content's quiz JSON schema) as an
 * interactive question flow — same shape as the app's quiz_screen.dart:
 * single-select for mcq/code-review, multi-select for "multi", reveal +
 * explanation on check, running score, pass/fail vs passScore, retry.
 */
export default function Quiz({data}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = data.questions;
  const question = questions[index];

  function toggle(optionId) {
    if (revealed) return;
    const next = new Set(selected);
    if (question.type === 'multi') {
      next.has(optionId) ? next.delete(optionId) : next.add(optionId);
    } else {
      next.clear();
      next.add(optionId);
    }
    setSelected(next);
  }

  function isCorrect() {
    const answer = new Set(question.answer);
    return (
      selected.size === answer.size &&
      [...selected].every((id) => answer.has(id))
    );
  }

  function check() {
    setRevealed(true);
    if (isCorrect()) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(new Set());
      setRevealed(false);
    } else {
      setFinished(true);
    }
  }

  function retry() {
    setIndex(0);
    setSelected(new Set());
    setRevealed(false);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const total = questions.length;
    const passed = total > 0 && score / total >= data.passScore;
    return (
      <div className={styles.resultCard}>
        <div className={styles.resultScore}>
          {score} / {total}
        </div>
        <p className={passed ? styles.resultPass : styles.resultFail}>
          {passed
            ? 'Passed — nice work.'
            : `Below ${Math.round(data.passScore * 100)}% — worth another read.`}
        </p>
        <button className={styles.retryButton} onClick={retry}>
          Retry quiz
        </button>
      </div>
    );
  }

  const answerSet = new Set(question.answer);

  return (
    <div className={styles.quiz}>
      <div className={styles.progressRow}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{width: `${((index + (revealed ? 1 : 0)) / questions.length) * 100}%`}}
          />
        </div>
        <span className={styles.progressLabel}>
          {index + 1}/{questions.length}
        </span>
      </div>

      <div className={styles.badgeRow}>
        <span className={styles.badge}>{question.difficulty}</span>
        {question.type === 'multi' && (
          <span className={styles.badge}>select all that apply</span>
        )}
        {question.type === 'code-review' && (
          <span className={styles.badge}>code review</span>
        )}
      </div>

      <div className={styles.prompt}>
        <ReactMarkdown>{question.prompt}</ReactMarkdown>
      </div>

      {question.code && (
        <div className={styles.codeBlock}>
          <CodeBlock language={question.codeLanguage || 'text'}>
            {question.code}
          </CodeBlock>
        </div>
      )}

      <div className={styles.options}>
        {question.options.map((option) => {
          const isAnswer = answerSet.has(option.id);
          const isSelected = selected.has(option.id);
          let stateClass = '';
          if (revealed && isAnswer) stateClass = styles.optionCorrect;
          else if (revealed && isSelected && !isAnswer) stateClass = styles.optionWrong;
          else if (isSelected) stateClass = styles.optionSelected;

          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.option} ${stateClass}`}
              onClick={() => toggle(option.id)}
              disabled={revealed}
            >
              <span className={styles.optionId}>{option.id})</span>
              <span className={styles.optionText}>
                <ReactMarkdown>{option.text}</ReactMarkdown>
              </span>
              {revealed && isAnswer && <span className={styles.optionIcon}>✓</span>}
              {revealed && isSelected && !isAnswer && (
                <span className={styles.optionIconWrong}>✕</span>
              )}
            </button>
          );
        })}
      </div>

      {revealed ? (
        <div className={isCorrect() ? styles.explanationCorrect : styles.explanationWrong}>
          <strong>{isCorrect() ? 'Correct' : 'Not quite'}</strong>
          <div className={styles.explanationBody}>
            <ReactMarkdown>{question.explanation}</ReactMarkdown>
          </div>
        </div>
      ) : null}

      {revealed ? (
        <button className={styles.primaryButton} onClick={next}>
          {index + 1 < questions.length ? 'Next' : 'Finish'}
        </button>
      ) : (
        <button
          className={styles.primaryButton}
          onClick={check}
          disabled={selected.size === 0}
        >
          Check answer
        </button>
      )}
    </div>
  );
}
