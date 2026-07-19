import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const courses = [
  {id: 'oop', title: 'Object-Oriented Programming', available: true, blurb: 'Encapsulation to architecture at scale', delivery: 'Bundled'},
  {id: 'dsa', title: 'Data Structures', available: true, blurb: 'Memory layout to choosing structures under real constraints', delivery: 'Bundled'},
  {id: 'algorithms', title: 'Algorithms', available: true, blurb: 'Complexity analysis to NP-hardness and approximation', delivery: 'Bundled'},
  {id: 'flutter', title: 'Flutter', available: true, blurb: 'Rendering pipeline to shipping', delivery: 'Downloadable'},
  {id: 'kotlin', title: 'Kotlin', available: true, blurb: 'Null safety to multiplatform', delivery: 'Downloadable'},
];

const stats = [
  {value: courses.filter((c) => c.available).length, label: 'Courses'},
  {value: '50', label: 'Chapters'},
  {value: '300', label: 'Quiz questions'},
  {value: '0', label: 'Ads, ever'},
];

const principles = [
  {
    badge: '↯',
    title: 'Offline. No login.',
    body: 'Every course and every quiz works with no account and no connection — read on the web here, or fully offline in the app.',
  },
  {
    badge: '⊘',
    title: 'No ads, no tracking.',
    body: 'Nothing is collected, nothing is sold. If CodeRecall helps you, sponsor links are in the app — that’s the entire business model.',
  },
  {
    badge: '◆',
    title: 'Written for seniors',
    body: 'Trade-offs, invariants, and the judgment calls interviewers actually probe — not beginner syntax explained for the tenth time.',
  },
  {
    badge: '✓',
    title: 'Quizzes that explain',
    body: 'Every question — right or wrong — comes with a real explanation of why each option is correct or not, on the web and in the app.',
  },
];

function Monogram({courseId}) {
  return (
    <span className={styles.monogram} data-course={courseId}>
      {courseId.slice(0, 2).toUpperCase()}
    </span>
  );
}

function CourseCard({course}) {
  if (!course.available) {
    return (
      <div className={styles.courseCardDisabled}>
        <Monogram courseId={course.id} />
        <div>
          <strong>{course.title}</strong>
          <p>{course.blurb}</p>
        </div>
        <span className={styles.pill}>Coming soon</span>
      </div>
    );
  }
  return (
    <Link className={styles.courseCard} to={`/docs/${course.id}`}>
      <Monogram courseId={course.id} />
      <div>
        <strong>{course.title}</strong>
        <p>{course.blurb}</p>
      </div>
      <span className={styles.pill}>{course.delivery}</span>
    </Link>
  );
}

export default function Home() {
  return (
    <Layout
      title="CodeRecall"
      description="Offline, no-login skill refreshers and quizzes for senior and staff-level developers.">
      <header className={styles.hero}>
        <div className="container">
          <Heading as="h1" className={styles.heroTitle}>
            Refresh your skills.<br />Not your login.
          </Heading>
          <p className={styles.heroSubtitle}>
            Senior-level dev courses and quizzes — offline, free, and built for
            developers who already know how to code.
          </p>
          <div className={styles.buttons}>
            <Link className="button button--lg" to="/docs/oop">
              Start the OOP course
            </Link>
            <Link
              className={clsx('button button--outline button--lg', styles.outlineButton)}
              href="https://github.com/rwaqar960/coderecall-app">
              Get the Android app
            </Link>
          </div>
          <div className={styles.statsRow}>
            {stats.map((s) => (
              <div key={s.label} className={styles.stat}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section className={styles.section}>
          <div className="container">
            <div className={styles.principlesGrid}>
              {principles.map((p) => (
                <div key={p.title} className={styles.principleCard}>
                  <span className={styles.principleBadge}>{p.badge}</span>
                  <Heading as="h3" className={styles.principleTitle}>
                    {p.title}
                  </Heading>
                  <p>{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <Heading as="h2">Courses</Heading>
            <p className={styles.sectionSubtitle}>
              Built one at a time, reviewed by hand — not generated in bulk.
              Basics ship inside the app; deeper tracks download on demand.
            </p>
            <div className={styles.courseGrid}>
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
