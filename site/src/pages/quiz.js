import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import {useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Quiz from '../components/Quiz';

function useQueryParams() {
  const {search} = useLocation();
  return new URLSearchParams(search);
}

export default function QuizPage() {
  const params = useQueryParams();
  const course = params.get('course');
  const chapter = params.get('chapter');
  const title = params.get('title');

  const dataUrl = useBaseUrl(
    course && chapter ? `quiz-data/${course}/${chapter}.json` : '',
  );

  const [state, setState] = useState({status: 'loading', data: null, error: null});

  useEffect(() => {
    if (!course || !chapter) {
      setState({status: 'error', data: null, error: 'Missing course or chapter.'});
      return;
    }
    let cancelled = false;
    fetch(dataUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`quiz data not found (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setState({status: 'ready', data, error: null});
      })
      .catch((err) => {
        if (!cancelled) setState({status: 'error', data: null, error: err.message});
      });
    return () => {
      cancelled = true;
    };
  }, [dataUrl, course, chapter]);

  return (
    <Layout title={title ? `Quiz · ${title}` : 'Quiz'} description="Chapter quiz">
      <main className="container margin-vert--lg">
        <h1>{title ? `Quiz: ${title}` : 'Chapter quiz'}</h1>
        {state.status === 'loading' && <p>Loading quiz…</p>}
        {state.status === 'error' && (
          <p>
            Couldn't load this quiz ({state.error}). Try opening it from the chapter
            page's "Take the chapter quiz" link.
          </p>
        )}
        {state.status === 'ready' && <Quiz data={state.data} />}
      </main>
    </Layout>
  );
}
