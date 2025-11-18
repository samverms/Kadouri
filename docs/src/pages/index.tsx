import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <p className={styles.heroDescription}>
          Streamline your produce and agricultural sales with integrated QuickBooks sync,
          commission tracking, and real-time order management.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/intro">
            Get Started →
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/architecture/overview"
            style={{marginLeft: '1rem'}}>
            View Architecture
          </Link>
        </div>
      </div>
    </header>
  );
}

function FeatureCard({icon, title, description}: {icon: string; title: string; description: string}) {
  return (
    <div className={clsx('col col--4', styles.featureCard)}>
      <div className={styles.featureIcon}>{icon}</div>
      <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  );
}

function KeyHighlights() {
  return (
    <section className={styles.highlights}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Key Features
        </Heading>
        <div className="row">
          <FeatureCard
            icon="📦"
            title="Order Management"
            description="Complete order lifecycle management with line-item commission tracking and dual PDF generation for sellers and buyers."
          />
          <FeatureCard
            icon="💼"
            title="QuickBooks Integration"
            description="Two-way sync with QuickBooks Online for customers, items, invoices, and payment status tracking."
          />
          <FeatureCard
            icon="🔐"
            title="Role-Based Access Control"
            description="Granular permissions across 10 modules with 4 default roles: Admin, Sales, BackOffice, and Accountant."
          />
          <FeatureCard
            icon="👥"
            title="Account Management"
            description="Manage sellers and buyers with multiple addresses, contacts, and automatic QuickBooks customer mapping."
          />
          <FeatureCard
            icon="📊"
            title="Advanced Reporting"
            description="Customer history, commission reports, sales analytics, and item summaries with export capabilities."
          />
          <FeatureCard
            icon="⚡"
            title="Modern Tech Stack"
            description="Built with Next.js 14, Express, PostgreSQL, Redis, and TailwindCSS for blazing-fast performance."
          />
        </div>
      </div>
    </section>
  );
}

function TechStack() {
  const technologies = [
    {category: 'Frontend', items: ['Next.js 14', 'TailwindCSS', 'TanStack Query', 'Clerk Auth']},
    {category: 'Backend', items: ['Node.js/Express', 'PostgreSQL', 'Drizzle ORM', 'Redis']},
    {category: 'Integration', items: ['QuickBooks Online', 'AWS S3', 'Puppeteer PDF', 'Outlook Email']},
  ];

  return (
    <section className={styles.techStack}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Enterprise-Grade Technology
        </Heading>
        <div className="row">
          {technologies.map((tech, idx) => (
            <div key={idx} className="col col--4">
              <div className={styles.techCard}>
                <Heading as="h4" className={styles.techCategory}>{tech.category}</Heading>
                <ul className={styles.techList}>
                  {tech.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStart() {
  return (
    <section className={styles.quickStart}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Quick Start
        </Heading>
        <div className={styles.codeBlock}>
          <pre>
{`# Install dependencies
npm install

# Set up environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Run database migrations
cd apps/api && npm run migration:run
npx tsx src/db/seed-roles.ts

# Start development servers
cd ../.. && npm run dev:admin`}
          </pre>
        </div>
        <div className={styles.quickStartLinks}>
          <Link
            className="button button--outline button--primary"
            to="/docs/getting-started/installation">
            Full Installation Guide
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description="Enterprise Order Management System for Agricultural Sales with QuickBooks Integration">
      <HomepageHeader />
      <main>
        <KeyHighlights />
        <TechStack />
        <QuickStart />
      </main>
    </Layout>
  );
}
