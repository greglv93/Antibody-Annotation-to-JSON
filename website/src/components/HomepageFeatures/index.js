import React from 'react';
import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const rawInputExample =
  require('!!raw-loader!@site/static/examples/sample_input.txt').default;
const rawOutputExample =
  require('!!raw-loader!@site/static/examples/sample_output.json').default;

function Feature({title, description, language, content}) {
  return (
    <div className={styles.featureColumn}>
      <Heading as="h3" className={styles.featureHeading}>
        {title}
      </Heading>
      <p className={styles.featureDescription}>{description}</p>
      <div className={styles.exampleWindow}>
        <CodeBlock language={language} showLineNumbers>
          {content}
        </CodeBlock>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  const innFormatPdfUrl = useBaseUrl('/files/INN_annotation_format.pdf');
  const jsonSchemaViewerUrl = useBaseUrl('/docs/doc/json-schema');

  const FeatureList = [
    {
      title: 'Before parsing (original flat text format)',
      description: (
        <>
          It follows this format specification:{' '}
          <a href={innFormatPdfUrl} target="_blank" rel="noopener noreferrer">
            INN annotation PDF
          </a>
          .
        </>
      ),
      language: 'text',
      content: rawInputExample.trim(),
    },
    {
      title: 'After parsing to JSON',
      description: (
        <>
          It follows this JSON schema:{' '}
          <Link to={jsonSchemaViewerUrl}>interactive JSON schema viewer</Link>.
        </>
      ),
      language: 'json',
      content: rawOutputExample.trim(),
    },
  ];

  return (
    <section className={styles.features}>
      <div className={clsx('container', styles.examplesContainer)}>
        <div className={styles.examplesRow}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
