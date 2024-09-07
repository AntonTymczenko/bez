import HeadWithTitle from "./head";
import { getContent } from "../src/content";

export default function Page(props) {
  const languageCode = null;
  const content = getContent(languageCode);
  // console.log(`Page`, { props });
  // Page { props: { params: {}, searchParams: {} } }

  const { heading, message } = content;

  return (
    <>
      <HeadWithTitle title={heading} />
      <div className="container">
        <h1 id="main-heading">{heading}</h1>
        <p id="subtext">{message}</p>
      </div>
    </>
  );
}
