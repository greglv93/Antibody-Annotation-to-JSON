import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import {useAllDocsData} from '@docusaurus/plugin-content-docs/client';

import Heading from '@theme/Heading';
import styles from './index.module.css';

const PRIMARY_DOC_ID = 'README';

function useDocPathById(docId) {
  const allDocsData = useAllDocsData();

  return React.useMemo(() => {
    if (!docId) {
      return undefined;
    }

    const pluginData =
      allDocsData?.default ?? Object.values(allDocsData ?? {})[0];
    const versions = pluginData?.versions ?? [];
    const preferredVersion =
      versions.find((version) => version.isLast) ?? versions[0];
    const doc = preferredVersion?.docs?.find((item) => item.id === docId);

    return doc?.path;
  }, [allDocsData, docId]);
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const primaryDocPath =
    useDocPathById(PRIMARY_DOC_ID) ?? `/docs/${PRIMARY_DOC_ID}`;
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to={primaryDocPath}>
            Read the Documentation
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Docs for ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
