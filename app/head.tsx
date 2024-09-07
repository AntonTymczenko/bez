import Head from "next/head";

type HeadProps = {
  title: string;
};

export default function HeadWithTitle(props: HeadProps) {
  const { title } = props;

  return (
    <Head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
    </Head>
  );
}
