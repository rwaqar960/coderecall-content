import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const courses = [
  {id: 'oop', title: 'Object-Oriented Programming', available: true, blurb: '10 chapters · encapsulation to architecture at scale'},
  {id: 'dsa', title: 'Data Structures', available: true, blurb: '10 chapters · memory layout to choosing structures under real constraints'},
  {id: 'algorithms', title: 'Algorithms', available: true, blurb: '10 chapters · complexity analysis to NP-hardness and approximation'},
  {id: 'flutter', title: 'Flutter', available: true, blurb: '10 chapters · rendering pipeline to shipping (downloadable pack)'},
  {id: 'kotlin', title: 'Kotlin', available: true, blurb: '10 chapters · null safety to multiplatform (downloadable pack)'},
];

const principles = [
  {title: 'Offline. No login.', body: 'Read every course and take every quiz with no account and no connection.'},
  {title: 'No ads, no tracking.', body: 'Nothing is collected. If CodeRecall helps you, sponsor links are in the app.'},
  {title: 'Written for seniors', body: 'Trade-offs and judgment calls, not beginner syntax — the questions interviewers actually ask.'},
];

function CourseCard({course}) {
  if (!course.available) {
    return (
      <div className={styles.courseCardComingSoon}>
        <strong>{course.title}</strong>
        <p>{course.blurb}</p>
      </div>
    );
  }
  return (
    <Link className={styles.courseCard} to={`/docs/${course.id}`}>
      <strong>{course.title}</strong>
      <p>{course.blurb}</p>
    </Link>
  );
}

export default function Home() {
  return (
    <Layout
      title="CodeRecall"
      description="Offline, no-login skill refreshers and quizzes for senior and staff-level developers.">
      <header className={clsx('hero hero--primary', styles.hero)}>
        <div className="container">
          <Heading as="h1" className="hero__title">
            CodeRecall
          </Heading>
          <p className="hero__subtitle">
            Senior-level dev skill refreshers, free and offline. No login, no ads, no tracking.
          </p>
          <div className={styles.buttons}>
            <Link className="button button--secondary button--lg" to="/docs/oop">
              Start the OOP course
            </Link>
            <Link
              className="button button--outline button--secondary button--lg"
              href="https://github.com/rwaqar960/coderecall-app">
              Get the Android app
            </Link>
          </div>
        </div>
      </header>
      <main className="container">
        <div className={styles.principles}>
          {principles.map((p) => (
            <div key={p.title}>
              <Heading as="h3">{p.title}</Heading>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
        <Heading as="h2">Courses</Heading>
        <p>Built one at a time. Read on the web here, or offline in the app.</p>
        <div className={styles.courseGrid}>
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </main>
    </Layout>
  );
}
