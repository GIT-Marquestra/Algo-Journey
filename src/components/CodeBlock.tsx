import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

const CodeBlock = ({ code, language = "javascript" }: {code: string, language: string}) => {
  return (
    <SyntaxHighlighter 
      language={language} 
      style={dracula} 
      wrapLongLines
      customStyle={{
        borderRadius: "8px",
        padding: "10px",
        fontSize: "14px",
        marginTop: "10px",
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;